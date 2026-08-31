// tg-login smoke + unit tests (node --test, zero deps).
import { test } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import http from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "tg-login");
const run = (args, opts = {}) => execFileSync("node", [BIN, ...args], { encoding: "utf8", ...opts });

test("no args / help exits 0 and prints usage", () => {
  const o = run([]);
  assert.match(o, /tg-login/);
  assert.match(o, /login <phone>/);
});

test("unknown command exits non-zero", () => {
  assert.throws(() => run(["wat"]));
});

test("parse handles ---- , tab and comma separators", () => {
  const input = [
    "+8801709299917----https://jiema.example/getcode?id=aaa",
    "8801907749099\thttps://jiema.example/getcode?id=bbb",
    "# a comment",
    "",
    "+8801725867873 , https://jiema.example/getcode?id=ccc",
  ].join("\n");
  const o = JSON.parse(run(["parse", "--json"], { input }));
  assert.equal(o.count, 3);
  assert.deepEqual(o.accounts[0], { phone: "+8801709299917", codeUrl: "https://jiema.example/getcode?id=aaa" });
  assert.equal(o.accounts[1].phone, "+8801907749099"); // + prepended
});

test("code command reads a served 接码 page (server in a child so execFile can\'t deadlock)", async () => {
  const { execFile } = await import("node:child_process");
  const pages = {
    "/ok": `<h1>Telegram登录信息</h1><div>设备验证码: 12980</div><div>登录时间: 2026-08-31 02:41:07</div><div>2fa/密码: didi</div>`,
    "/rl": `<div>错误信息：请求过于频繁，请等待 41 秒再试。</div>`,
    "/empty": `<div>错误信息：无三十分钟内的登录消息</div>`,
  };
  pages["/noise"] = `<div>错误信息：无三十分钟内的登录消息</div><script>window.dataLayer=[];gtag('js', 99999);</script> didi document.addEventListener('DOMContentLoaded', c)`;
  const srv = http.createServer((req, res) => { res.end(pages[req.url] || "nope"); });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const port = srv.address().port;
  const call = (p) => new Promise((res, rej) =>
    execFile("node", [BIN, "code", `http://127.0.0.1:${port}${p}`, "--json"], (e, so) => e ? rej(e) : res(JSON.parse(so))));
  try {
    const ok = await call("/ok");
    assert.equal(ok.code, "12980"); assert.equal(ok.twofa, "didi"); assert.match(ok.time, /2026-08-31/);
    const rl = await call("/rl");
    assert.equal(rl.rateLimited, true); assert.equal(rl.waitSeconds, 41);
    const em = await call("/empty");
    assert.ok(!em.code); assert.equal(em.empty, true);
    const noise = await call("/noise");
    assert.ok(!noise.code, "must not match a code from page/script noise");
    assert.ok(!noise.twofa, "no 2fa without a real code");
  } finally { srv.close(); }
});

test("targets errors cleanly when CDP is down", () => {
  // point at a closed port; expect a non-zero exit with a JSON error
  try { run(["targets", "--json"], { env: { ...process.env, TG_CDP_PORT: "1" } }); assert.fail("should throw"); }
  catch (e) { assert.ok(e.status !== 0); }
});

test("parseTimeMs orders 接码 login times and gates freshness", async () => {
  const { execFile } = await import("node:child_process");
  const older = "<div>设备验证码: 11111</div><div>登录时间: 2026-08-31 03:50:00</div>";
  const newer = "<div>设备验证码: 22222</div><div>登录时间: 2026-08-31 03:57:11</div>";
  const srv = http.createServer((req, res) => { res.end(req.url === "/new" ? newer : older); });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const port = srv.address().port;
  const call = (p) => new Promise((res, rej) => execFile("node", [BIN, "code", `http://127.0.0.1:${port}${p}`, "--json"], (e, so) => e ? rej(e) : res(JSON.parse(so))));
  try {
    const a = await call("/old"), b = await call("/new");
    // both parse a code+time; the newer one must sort after the older one
    assert.equal(a.code, "11111"); assert.equal(b.code, "22222");
    assert.ok(Date.parse(b.time.replace(" ", "T")) > Date.parse(a.time.replace(" ", "T")));
  } finally { srv.close(); }
});

test("a dead 接码 card is terminal: reported as dead, exit 5, 补号 link surfaced", async () => {
  const { execFile } = await import("node:child_process");
  // The real page an offline card serves (tags stripped by parseCodePage).
  const dead = `<h3>发生错误</h3><p>错误信息：</p><p>接码设备已掉线！</p>
    <p>此号未登录过，<a href="https://buhao.tgqqq.com/?prefill=Kzg4MDE4Nzg5">👉点此进入自助补号</a></p>
    <a href="https://help.tgqqq.com/">✅✅登录不上？点此查看使用教程！✅✅</a>`;
  const frozen = `<p>错误信息：</p><p>该号已冻结</p>`;
  const srv = http.createServer((req, res) => { res.end(req.url === "/frozen" ? frozen : dead); });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const port = srv.address().port;
  const call = (p, cmd = "code") => new Promise((res) => execFile("node", [BIN, cmd, `http://127.0.0.1:${port}${p}`, "--json"], (e, so) => res({ status: e ? e.code : 0, out: JSON.parse(so) })));
  try {
    const d = await call("/dead");
    assert.equal(d.out.dead, true, "offline device must be flagged dead, not just empty");
    assert.equal(d.status, 5, "dead card exits 5 so callers can branch on it");
    assert.match(d.out.reason, /掉线/);
    assert.equal(d.out.fixUrl, "https://buhao.tgqqq.com/?prefill=Kzg4MDE4Nzg5", "the 补号 link, not the help link");
    assert.equal((await call("/frozen")).out.dead, true, "a frozen number is dead too");
    // poll must give up at once instead of burning its 8-minute window
    const started = Date.now();
    const p = await call("/dead", "poll");
    assert.equal(p.out.dead, true);
    assert.ok(Date.now() - started < 30000, "poll must not keep retrying a dead card");
  } finally { srv.close(); }
});

test("a normal empty page is NOT dead (polling should continue)", async () => {
  const { execFile } = await import("node:child_process");
  const srv = http.createServer((_q, res) => res.end(`<p>错误信息：</p><p>无三十分钟内的登录消息</p>`));
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const port = srv.address().port;
  try {
    const o = await new Promise((res) => execFile("node", [BIN, "code", `http://127.0.0.1:${port}/x`, "--json"], (_e, so) => res(JSON.parse(so))));
    assert.equal(o.empty, true);
    assert.ok(!o.dead, "no code yet is a transient state, not a dead card");
  } finally { srv.close(); }
});

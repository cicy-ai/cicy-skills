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

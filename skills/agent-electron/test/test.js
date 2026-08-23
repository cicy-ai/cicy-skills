#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const D = new URL('..', import.meta.url).pathname;

// no args → shows help (exit 0)
const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.includes('agent-electron'));

// --help exits 0 with output
const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);
assert('--help lists tabs discovery', help.stdout.includes('tabs [accountIdx]'));
assert('--help lists profiles discovery', help.stdout.includes('profiles [--json]'));
assert('--help lists all-webcontents discovery', help.stdout.includes('webcontents [--json]'));
assert('--help explains account/profile/session identity', help.stdout.includes('accountIdx` = profile id = session id'));
assert('--help marks dual-id commands', help.stdout.includes('close <winId|webContentsId>'));
assert('--help marks dual-id CDP', help.stdout.includes('cdp <winId|webContentsId>'));
assert('--help marks dual-id snapshot', help.stdout.includes('snapshot <winId|webContentsId>'));
assert('--help lists inject installation', help.stdout.includes('inject install <name> --source <file>'));

// unknown subcommand → non-0
const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

// proxy missing args → non-0
const proxyBad = runSkill(D, ['proxy', '--json']);
assert('proxy without args exits non-0', proxyBad.status !== 0);

// open missing --url → non-0
const openBad = runSkill(D, ['open', '99', '--json']);
assert('open without --url exits non-0', openBad.status !== 0);

// cdp missing args → non-0
const cdpBad = runSkill(D, ['cdp', '4', '--json']);
assert('cdp without method exits non-0', cdpBad.status !== 0);

// Typed ids are parsed before any RPC is attempted. This distinguishes a
// malformed tab reference from an unavailable desktop connection.
const tabBad = runSkill(D, ['window', 'tab:nope', '--json']);
assert('malformed webContentsId exits non-0', tabBad.status !== 0);
assert('malformed webContentsId reports numeric target', tabBad.stdout.includes('must be a number'));

const fixtureDir = mkdtempSync(join(tmpdir(), 'agent-electron-inject-'));
const portFile = join(fixtureDir, 'port');
const callsFile = join(fixtureDir, 'calls.jsonl');
const server = spawn(process.execPath, ['-e', `
  const http = require('http'); const fs = require('fs');
  const calls = process.argv[1]; const portFile = process.argv[2];
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.method === 'GET' && req.url === '/api/chat/clients') {
      return res.end(JSON.stringify({data:[{client_id:'desktop-1',isElectron:true,user_agent:'CiCyDesktop',platform:'win32'}]}));
    }
    if (req.method === 'POST' && req.url === '/api/chat/push') {
      let body=''; req.on('data', c => body += c); req.on('end', () => {
        fs.appendFileSync(calls, body + '\\n');
        const parsed=JSON.parse(body); const operation=parsed.data.args.operation;
        let value;
        if (parsed.data.tool === 'exec_shell') value={stdout:'C:\\\\Users\\\\test\\r\\n',stderr:'',exitCode:0};
        else if (parsed.data.tool === 'file_write') value={success:true,path:parsed.data.args.path,size:21};
        else value={operation,name:parsed.data.args.name,path:'C:\\\\Users\\\\test\\\\data\\\\electron\\\\extension\\\\inject\\\\'+parsed.data.args.name,exists:operation!=='uninstall',size:21,sha256:'a'.repeat(64)};
        res.end(JSON.stringify({data:{result:{content:[{type:'text',text:JSON.stringify(value)}]}}}));
      }); return;
    }
    res.statusCode=404; res.end(JSON.stringify({error:'not_found'}));
  });
  server.listen(0,'127.0.0.1',()=>fs.writeFileSync(portFile,String(server.address().port)));
`, callsFile, portFile], { stdio: 'ignore' });
let port = '';
for (let i = 0; i < 100 && !port; i++) {
  try { port = readFileSync(portFile, 'utf8').trim(); } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20); }
}
const globalFile = join(fixtureDir, 'global.json');
const sourceFile = join(fixtureDir, 'telegram.org.js');
const sentinel = 'window.__private_inject_sentinel__ = true;';
writeFileSync(globalFile, JSON.stringify({ api_token: 'test-token' }));
writeFileSync(sourceFile, sentinel);
writeFileSync(callsFile, '');
const injectEnv = { CICY_GLOBAL_JSON: globalFile, CICY_API_PORT: port };
const install = runSkill(D, ['inject', 'install', 'telegram.org.js', '--source', sourceFile, '--json'], injectEnv);
const status = runSkill(D, ['inject', 'status', 'telegram.org.js', '--json'], injectEnv);
const uninstall = runSkill(D, ['inject', 'uninstall', 'telegram.org.js', '--json'], injectEnv);
server.kill();
const callText = readFileSync(callsFile, 'utf8').trim();
const calls = callText ? callText.split('\n').map(JSON.parse) : [];
rmSync(fixtureDir, { recursive: true, force: true });
assert('inject install resolves the Windows home directory', install.status === 0 && calls[0]?.data?.tool === 'exec_shell' && calls[0]?.data?.args?.command === 'echo %USERPROFILE%', install.stdout + install.stderr);
assert('inject install saves source through agent-desktop file_write', calls[1]?.data?.tool === 'file_write' && calls[1]?.data?.args?.path === 'C:\\Users\\test\\data\\electron\\extension\\inject\\telegram.org.js' && calls[1]?.data?.args?.content === sentinel, install.stdout + install.stderr);
assert('inject install never prints source content', !install.stdout.includes(sentinel) && !install.stderr.includes(sentinel));
assert('inject status calls the restricted desktop tool without content', status.status === 0 && calls[2]?.data?.args?.operation === 'status' && !('content' in calls[2].data.args), status.stdout + status.stderr);
assert('inject uninstall calls the restricted desktop tool', uninstall.status === 0 && calls[3]?.data?.args?.operation === 'uninstall', uninstall.stdout + uninstall.stderr);

finish();

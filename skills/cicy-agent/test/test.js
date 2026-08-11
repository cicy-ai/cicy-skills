#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const D = new URL('..', import.meta.url).pathname;

const noArgs = runSkill(D, []);
assert('no args exits 0 (help)', noArgs.status === 0);
assert('no args prints help', noArgs.stdout.includes('cicy-agent'));

const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

const bad = runSkill(D, ['badcmd']);
assert('unknown subcommand exits non-0', bad.status !== 0);

const removedTeam = runSkill(D, ['team', 'ls']);
assert('legacy team registry command is removed', removedTeam.status !== 0 && removedTeam.stderr.includes('unknown command: team'));

const removedTeamFlag = runSkill(D, ['--team', 'missing', 'ls']);
assert('legacy --team flag is removed', removedTeamFlag.status !== 0 && removedTeamFlag.stderr.includes('unknown command: --team'));

const cloudMissing = runSkill(D, ['cloud', 'ls'], {
  CICY_CLOUD_DEVICE_JSON: '/tmp/cicy-agent-test-missing-cloud-device.json',
});
assert('cloud command reports missing login clearly', cloudMissing.status !== 0 && cloudMissing.stderr.includes('Cloud login not found'));

// list --json → valid JSON (server may be up on this host)
const list = runSkill(D, ['list', '--json']);
const listJson = (() => { try { JSON.parse(list.stdout); return true; } catch { return false; } })();
assert('list --json is valid JSON or exits non-0', listJson || list.status !== 0);

// A Cloud send must become observable as soon as POST succeeds, rather than
// remaining silent while the correlated reply poll is still pending.
const fixtureDir = mkdtempSync(join(tmpdir(), 'cicy-agent-cloud-test-'));
const portFile = join(fixtureDir, 'port');
const server = spawn(process.execPath, ['-e', `
  const http = require('http');
  const fs = require('fs');
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/code/instances') return res.end(JSON.stringify({instances:[
      {instanceId:'code-source-1234567890123456',teamId:'local'},
      {instanceId:'code-target-1234567890123456',teamId:'remote'}
    ]}));
    if (req.url === '/api/code/agents') return res.end(JSON.stringify({agents:[
      {instanceId:'code-source-1234567890123456',agentId:'w-test'},
      {instanceId:'code-target-1234567890123456',agentId:'w-102'}
    ]}));
    if (req.method === 'POST' && req.url === '/api/im/cicy-cloud/send') return res.end(JSON.stringify({transport:'ws',message:{id:'msg-ws-12345678'}}));
    if (req.url.startsWith('/api/im/cicy-cloud/status')) return res.end(JSON.stringify({status:'replied',transport:'ws',reply:{id:'msg-reply-12345678',text:'ws answer'}}));
    if (req.method === 'POST' && req.url === '/api/code/messages') return res.end(JSON.stringify({message:{id:'msg-http-12345678'}}));
    if (req.url.startsWith('/api/code/messages/status')) return res.end(JSON.stringify({status:'pending',reply:null}));
    res.statusCode = 404; res.end(JSON.stringify({error:'not_found'}));
  });
  server.listen(0, '127.0.0.1', () => fs.writeFileSync(process.argv[1], String(server.address().port)));
`, portFile], { stdio: 'ignore' });
let port = '';
for (let i = 0; i < 100 && !port; i++) {
  try { port = readFileSync(portFile, 'utf8').trim(); } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20); }
}
const deviceFile = join(fixtureDir, 'cloud-device.json');
writeFileSync(deviceFile, JSON.stringify({ token: 'test-token', cloud_origin: `http://127.0.0.1:${port}`, instance_id: 'code-source-1234567890123456' }));
const cloudGlobalFile = join(fixtureDir, 'global.json');
writeFileSync(cloudGlobalFile, JSON.stringify({api_token:'local-test-token'}));
const started = Date.now();
const cli = spawn(process.execPath, [join(D, 'bin/cicy-agent'), 'msg', 'remote.w-102', 'hello', '--timeout', '3'], {
  env: { ...process.env, CICY_CLOUD_DEVICE_JSON: deviceFile, CICY_GLOBAL_JSON: cloudGlobalFile, CICY_API_PORT: port, X_AGENT_SHORT_ID: 'w-test' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let firstOutputAt = 0;
let cloudStdout = '';
cli.stdout.on('data', (chunk) => {
  if (!firstOutputAt) firstOutputAt = Date.now();
  cloudStdout += chunk;
});
await new Promise((resolve) => cli.on('close', resolve));
server.kill();
rmSync(fixtureDir, { recursive: true, force: true });
assert('cloud msg prefers local websocket path and receives reply', firstOutputAt > 0 && firstOutputAt - started < 1500 && cloudStdout.includes('msg_id=msg-ws-12345678  transport=ws  status=pending') && cloudStdout.includes('ws answer') && !cloudStdout.includes('msg-http-12345678'), cloudStdout);

// Local and Cloud messages expose the same immediate-id + structured-wait
// lifecycle. Local completion comes from /api/agent/messages, never capture.
const localDir = mkdtempSync(join(tmpdir(), 'cicy-agent-local-test-'));
const localPortFile = join(localDir, 'port');
const localServer = spawn(process.execPath, ['-e', `
  const http = require('http'); const fs = require('fs'); let polls = 0;
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/health') return res.end(JSON.stringify({team_id:'local'}));
    if (req.method === 'POST' && req.url === '/api/tmux/send') return res.end(JSON.stringify({success:true,msg_id:'local-msg-12345678'}));
    if (req.url === '/api/agent/messages') {
      polls++;
      return res.end(JSON.stringify({messages:[{id:'local-msg-12345678',status:polls > 1 ? 'done' : 'sent',turn:polls > 1 ? {a:'local answer'} : null}]}));
    }
    res.statusCode=404; res.end(JSON.stringify({error:'not_found'}));
  });
  server.listen(0,'127.0.0.1',()=>fs.writeFileSync(process.argv[1],String(server.address().port)));
`, localPortFile], { stdio: 'ignore' });
let localPort = '';
for (let i = 0; i < 100 && !localPort; i++) {
  try { localPort = readFileSync(localPortFile, 'utf8').trim(); } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20); }
}
const globalFile = join(localDir, 'global.json');
writeFileSync(globalFile, JSON.stringify({api_token:'local-test-token'}));
const local = runSkill(D, ['msg', 'w-102', 'hello', '--timeout', '3'], {
  CICY_GLOBAL_JSON: globalFile,
  CICY_API_PORT: localPort,
  X_AGENT_SHORT_ID: 'w-test',
});
localServer.kill();
rmSync(localDir, { recursive: true, force: true });
assert('local msg prints id and structured reply', local.status === 0 && local.stdout.includes('msg_id=local-msg-12345678  status=sent') && local.stdout.includes('local answer'), local.stdout + local.stderr);

finish();

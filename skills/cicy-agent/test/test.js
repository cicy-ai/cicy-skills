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

// projects joins /api/groups membership with pane metadata and supports both
// all-project and current-project views.
const projectsDir = mkdtempSync(join(tmpdir(), 'cicy-agent-projects-test-'));
const projectsPortFile = join(projectsDir, 'port');
const projectsServer = spawn(process.execPath, ['-e', `
  const http = require('http'); const fs = require('fs');
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/api/groups') return res.end(JSON.stringify({groups:[
      {id:1,name:'Default',is_default:true,project_template:'default',pane_ids:['w-101','w-102:main.0']},
      {id:2,name:'Release',is_default:false,project_template:'release',pane_ids:['w-103']}
    ]}));
    if (req.url === '/api/tmux/panes') return res.end(JSON.stringify({panes:[
      {pane_id:'w-101',title:'Architect',agent_type:'codex'},
      {pane_id:'w-102:main.0',title:'Builder',agent_type:'claude'},
      {pane_id:'w-103',title:'Publisher',agent_type:'cicy'}
    ]}));
    if (req.url === '/api/tmux/tree') return res.end(JSON.stringify({tree:[
      {session:'w-102'}, {session:'w-103'}
    ]}));
    res.statusCode=404; res.end(JSON.stringify({error:'not_found'}));
  });
  server.listen(0,'127.0.0.1',()=>fs.writeFileSync(process.argv[1],String(server.address().port)));
`, projectsPortFile], { stdio: 'ignore' });
let projectsPort = '';
for (let i = 0; i < 100 && !projectsPort; i++) {
  try { projectsPort = readFileSync(projectsPortFile, 'utf8').trim(); } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20); }
}
const projectsGlobalFile = join(projectsDir, 'global.json');
writeFileSync(projectsGlobalFile, JSON.stringify({api_token:'local-test-token'}));
const projectsAll = runSkill(D, ['projects'], { CICY_GLOBAL_JSON: projectsGlobalFile, CICY_API_PORT: projectsPort });
const projectsCurrent = runSkill(D, ['projects', '--current', '--json'], { CICY_GLOBAL_JSON: projectsGlobalFile, CICY_API_PORT: projectsPort, X_AGENT_SHORT_ID: 'w-102', CICY_AGENT_RUNNING_SESSIONS: 'w-102,w-103' });
const rosterLs = runSkill(D, ['ls', '--json'], { CICY_GLOBAL_JSON: projectsGlobalFile, CICY_API_PORT: projectsPort, CICY_AGENT_RUNNING_SESSIONS: 'w-102,w-103' });
const rosterAll = runSkill(D, ['get_all_agents', '--json'], { CICY_GLOBAL_JSON: projectsGlobalFile, CICY_API_PORT: projectsPort, CICY_AGENT_RUNNING_SESSIONS: 'w-102,w-103' });
projectsServer.kill();
rmSync(projectsDir, { recursive: true, force: true });
assert('projects lists every project without nested agents', projectsAll.status === 0 && projectsAll.stdout.includes('Default (#1)') && projectsAll.stdout.includes('Release (#2)') && !projectsAll.stdout.includes('w-102') && !projectsAll.stdout.includes('Builder'));
let currentProjects;
try { currentProjects = JSON.parse(projectsCurrent.stdout); } catch { currentProjects = null; }
assert('projects --current --json returns only the current agent project', projectsCurrent.status === 0 && currentProjects?.data?.projects?.length === 1 && currentProjects.data.projects[0].id === 1 && currentProjects.data.projects[0].agents.length === 2, projectsCurrent.stdout + projectsCurrent.stderr);
const projectAgent = currentProjects?.data?.projects?.[0]?.agents?.find((agent) => agent.id === 'w-102');
assert('project agents return the full roster fields', projectAgent?.online === true && projectAgent?.pane_id === 'w-102:main.0' && 'model' in projectAgent && 'provider' in projectAgent && 'local_gateway' in projectAgent && 'context_usage' in projectAgent && 'cost' in projectAgent && 'idle' in projectAgent && 'workspace' in projectAgent, projectsCurrent.stdout);
let rosterLsJson, rosterAllJson;
try { rosterLsJson = JSON.parse(rosterLs.stdout); rosterAllJson = JSON.parse(rosterAll.stdout); } catch { rosterLsJson = rosterAllJson = null; }
assert('ls and get_all_agents return identical data', rosterLs.status === 0 && rosterAll.status === 0 && JSON.stringify(rosterLsJson) === JSON.stringify(rosterAllJson), rosterLs.stdout + rosterLs.stderr + rosterAll.stdout + rosterAll.stderr);

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
const fallback = runSkill(D, ['msg', 'remote.w-102', 'fallback', '--timeout', '1'], {
  CICY_CLOUD_DEVICE_JSON: deviceFile,
  CICY_GLOBAL_JSON: cloudGlobalFile,
  CICY_API_PORT: '1',
  X_AGENT_SHORT_ID: 'w-test',
});
server.kill();
rmSync(fixtureDir, { recursive: true, force: true });
assert('cloud msg prefers local websocket path and receives reply', firstOutputAt > 0 && firstOutputAt - started < 1500 && cloudStdout.includes('msg_id=msg-ws-12345678  transport=ws  status=pending') && cloudStdout.includes('ws answer') && !cloudStdout.includes('msg-http-12345678'), cloudStdout);
assert('cloud msg falls back to Worker HTTP when local websocket path is unavailable', fallback.stdout.includes('msg_id=msg-http-12345678  transport=http  status=pending'), fallback.stdout + fallback.stderr);

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

#!/usr/bin/env node
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const bin = join(root, 'bin', 'github');
const dir = mkdtempSync(join(tmpdir(), 'github-skill-'));
const config = join(dir, 'github.json');
const env = { ...process.env, CICY_GITHUB_CONFIG: config };
const token = 'github_test_secret_1234567890';

let result = spawnSync(bin, ['add', 'work', '--token-stdin', '--email', 'dev@example.com'], { env, input: token, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout.includes(token), false);
assert.equal(statSync(config).mode & 0o777, 0o600);
assert.equal(JSON.parse(readFileSync(config, 'utf8')).work.api_token, token);

result = spawnSync(bin, ['accounts', '--json'], { env, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout.includes(token), false);
assert.deepEqual(JSON.parse(result.stdout), [{ name: 'work', email: 'dev@example.com', token_configured: true }]);

const fakeBin = join(dir, 'bin');
const ghCapture = join(dir, 'gh-capture.json');
mkdirSync(fakeBin);
writeFileSync(join(fakeBin, 'gh'), `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(process.env.TEST_GH_CAPTURE, JSON.stringify({ token: process.env.GH_TOKEN, githubToken: process.env.GITHUB_TOKEN || '', args: process.argv.slice(2) }));
`);
chmodSync(join(fakeBin, 'gh'), 0o755);
result = spawnSync(bin, ['gh', '--account', 'work', 'run', 'list', '--repo', 'owner/repo'], {
  env: { ...env, PATH: `${fakeBin}:${process.env.PATH}`, TEST_GH_CAPTURE: ghCapture, GITHUB_TOKEN: 'wrong-account-token' }, encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout.includes(token) || result.stderr.includes(token), false);
assert.deepEqual(JSON.parse(readFileSync(ghCapture, 'utf8')), { token, githubToken: '', args: ['run', 'list', '--repo', 'owner/repo'] });

// gh missing from PATH → fall back to the runtime dir (no network needed when the binary already exists)
const runtime = join(dir, 'runtime');
const runtimeBin = join(runtime, '9.9.9', 'gh');
mkdirSync(join(runtime, '9.9.9'), { recursive: true });
writeFileSync(runtimeBin, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
if (process.argv[2] === '--version') { console.log('gh version 9.9.9 (fake)'); process.exit(0); }
writeFileSync(process.env.TEST_GH_CAPTURE, JSON.stringify({ from: 'runtime', args: process.argv.slice(2) }));
`);
chmodSync(runtimeBin, 0o755);
const noGhPath = process.env.PATH.split(':').filter((p) => !existsSync(join(p, 'gh'))).join(':');
result = spawnSync(bin, ['gh', '--account', 'work', 'pr', 'list'], {
  env: { ...env, PATH: noGhPath, CICY_GH_RUNTIME: runtime, CICY_GH_VERSION: '9.9.9', TEST_GH_CAPTURE: ghCapture }, encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
assert.deepEqual(JSON.parse(readFileSync(ghCapture, 'utf8')), { from: 'runtime', args: ['pr', 'list'] });

// gh-setup reports the resolved binary
result = spawnSync(bin, ['gh-setup'], { env: { ...env, PATH: noGhPath, CICY_GH_RUNTIME: runtime, CICY_GH_VERSION: '9.9.9' }, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout.split('\n')[0], runtimeBin);

result = spawnSync(bin, ['gh', '--account', 'work', 'auth', 'token'], { env, encoding: 'utf8' });
assert.notEqual(result.status, 0);
assert.equal(result.stdout.includes(token) || result.stderr.includes(token), false);

result = spawnSync(bin, ['add', 'bad/account', '--token-stdin'], { env, input: token, encoding: 'utf8' });
assert.notEqual(result.status, 0);
assert.equal(result.stderr.includes(token), false);

result = spawnSync(bin, ['remove', 'work', '--yes'], { env, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.deepEqual(JSON.parse(readFileSync(config, 'utf8')), {});

process.stdout.write('github skill tests passed\n');

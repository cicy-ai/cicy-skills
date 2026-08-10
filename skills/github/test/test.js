#!/usr/bin/env node
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
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

result = spawnSync(bin, ['add', 'bad/account', '--token-stdin'], { env, input: token, encoding: 'utf8' });
assert.notEqual(result.status, 0);
assert.equal(result.stderr.includes(token), false);

const fakeBin = join(dir, 'bin');
const gitLog = join(dir, 'git-log.json');
mkdirSync(fakeBin);
const fakeGit = join(fakeBin, 'git');
writeFileSync(fakeGit, `#!/usr/bin/env node
const { writeFileSync } = require('node:fs');
writeFileSync(process.env.GIT_LOG, JSON.stringify({
  args: process.argv.slice(2),
  askpass: Boolean(process.env.GIT_ASKPASS),
  tokenPresent: process.env.CICY_GITHUB_ASKPASS_TOKEN === ${JSON.stringify(token)},
  terminalPrompt: process.env.GIT_TERMINAL_PROMPT,
}));
`);
chmodSync(fakeGit, 0o755);
result = spawnSync(bin, ['git', '--account', 'work', '--', 'push', 'origin', 'main'], {
  env: { ...env, PATH: `${fakeBin}:${env.PATH}`, GIT_LOG: gitLog }, encoding: 'utf8',
});
assert.equal(result.status, 0, result.stderr);
assert.equal(result.stdout.includes(token), false);
assert.equal(result.stderr.includes(token), false);
assert.deepEqual(JSON.parse(readFileSync(gitLog, 'utf8')), {
  args: ['-c', 'credential.helper=', 'push', 'origin', 'main'],
  askpass: true,
  tokenPresent: true,
  terminalPrompt: '0',
});

result = spawnSync(bin, ['remove', 'work', '--yes'], { env, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.deepEqual(JSON.parse(readFileSync(config, 'utf8')), {});

process.stdout.write('github skill tests passed\n');

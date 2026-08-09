#!/usr/bin/env node
import { mkdtempSync, readFileSync, statSync } from 'node:fs';
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

result = spawnSync(bin, ['remove', 'work', '--yes'], { env, encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr);
assert.deepEqual(JSON.parse(readFileSync(config, 'utf8')), {});

process.stdout.write('github skill tests passed\n');

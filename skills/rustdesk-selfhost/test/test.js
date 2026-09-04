// Smoke test: the binary loads, prints help, and builds client artifacts from a
// throwaway config without touching the real one. No docker/network required.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { rmSync } from 'node:fs';
import assert from 'node:assert';

const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'rustdesk-selfhost');
const TMP = join(process.env.TMPDIR || '/tmp', `rdsh-test-${process.pid}.json`);
const env = { ...process.env, CICY_RUSTDESK_CONFIG: TMP };
const run = (...a) => execFileSync('node', [BIN, ...a], { encoding: 'utf8', env });

try {
  assert.match(run('--help'), /server-up/, 'help lists server-up');

  run('config', 'host=rd.test.example', 'key=TESTPUBKEY123', 'password=pw123');
  const cc = run('client-config');
  assert.match(cc, /rd\.test\.example:21116/, 'client-config has ID server');
  assert.match(cc, /TESTPUBKEY123/, 'client-config has key');

  const toml = run('client-toml');
  assert.match(toml, /custom-rendezvous-server = 'rd\.test\.example:21116'/, 'toml rendezvous');
  assert.match(toml, /relay-server = 'rd\.test\.example:21117'/, 'toml relay');

  const bat = run('enroll-script');
  assert.match(bat, /Run as administrator/, 'bat has admin gate');
  assert.match(bat, /--password pw123/, 'bat sets password');
  assert.ok(bat.includes('\r\n'), 'bat uses CRLF');

  const fw = run('firewall', 'gcloud');
  assert.match(fw, /udp:21116/, 'firewall includes udp 21116');

  console.log('rustdesk-selfhost: all smoke tests passed');
} finally {
  try { rmSync(TMP); } catch {}
}

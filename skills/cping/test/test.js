#!/usr/bin/env node
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// --help exits 0 with output
const help = runSkill(D, ['--help']);
assert('--help exits 0', help.status === 0);
assert('--help has output', help.stdout.length > 0);

// no args → exit 2
const noArgs = runSkill(D, []);
assert('no args exits 2', noArgs.status === 2);

// --json with bad host → ok:false JSON
const bad = runSkill(D, ['this-host-does-not-exist-xyz.invalid', '--json', '--timeout', '3']);
assert('bad host --json exits non-0', bad.status !== 0);
let parsed;
try { parsed = JSON.parse(bad.stdout); } catch {}
assert('bad host --json is valid JSON', !!parsed);
assert('bad host --json has ok:false', parsed?.ok === false);

// --dns-only on localhost → exits 0
const local = runSkill(D, ['localhost', '--dns-only', '--json']);
assert('localhost --dns-only exits 0', local.status === 0);
let loc;
try { loc = JSON.parse(local.stdout); } catch {}
assert('localhost --dns-only returns ok:true', loc?.ok === true);
assert('localhost --dns-only has dns.address', !!loc?.dns?.address);

finish();

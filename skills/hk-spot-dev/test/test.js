#!/usr/bin/env node
// hk-spot-dev has no --help flag; no-args starts provisioning.
// Tests are limited to CLI error-path behaviors only.
import { runSkill, assert, finish } from '../../../tools/test-helper.js';
const D = new URL('..', import.meta.url).pathname;

// --destroy with missing aliyun config → non-0
const destroy = runSkill(D, ['--destroy'], { HOME: '/tmp/no-such-home-xyz' });
assert('--destroy without aliyun config exits non-0', destroy.status !== 0);

// --push-image with no running instance → non-0
const push = runSkill(D, ['--push-image'], { HOME: '/tmp/no-such-home-xyz' });
assert('--push-image without instance exits non-0', push.status !== 0);

finish();

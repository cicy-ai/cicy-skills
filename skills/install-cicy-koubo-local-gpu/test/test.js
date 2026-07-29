#!/usr/bin/env node
import { runSkill, assert, finish } from "../../../tools/test-helper.js";

const skillDir = new URL("..", import.meta.url).pathname;

const noArgs = runSkill(skillDir, []);
assert("no args shows help", noArgs.status === 0 && noArgs.stdout.includes("install"));
assert("help documents port 8771", noArgs.stdout.includes("8771"));
assert("help documents largest drive selection", noArgs.stdout.includes("最大"));

const help = runSkill(skillDir, ["--help"]);
assert("--help exits 0", help.status === 0);

const unknown = runSkill(skillDir, ["unknown"]);
assert("unknown command exits non-zero", unknown.status !== 0);

if (process.platform !== "win32") {
  const install = runSkill(skillDir, ["install"]);
  assert("install rejects non-Windows hosts", install.status !== 0);
  assert("non-Windows error is actionable", install.stderr.includes("Windows"));
}

finish();

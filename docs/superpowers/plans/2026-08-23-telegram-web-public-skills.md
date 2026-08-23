# Telegram Web Public Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the tested Mac Telegram Web A/K automation and Electron mirror injection as safe, platform-neutral public skills.

**Architecture:** Add `tg-web-mirror-hook` as the isolated Telegram Web K cache-patch and verification component, then upgrade the existing `telegram-web` package to a modular A/K CLI that delegates K patching to that component. Preserve the repository's manifest, bilingual references, zero-dependency Node CLI, validation, tag-driven immutable release, and one-skill-at-a-time release conventions.

**Tech Stack:** Node.js 22, ESM/CommonJS as already implemented by each package, `node:test`, CiCy `agent-electron`/`agent-chrome`, repository validation and publishing scripts.

**Spec:** `docs/superpowers/specs/2026-08-23-telegram-web-public-skills-design.md`

## Global Constraints

- Publish no credentials, browser storage, session files, live Telegram data, or user-specific absolute paths.
- Use no default proxy; require `--proxy URL` when a proxy is needed.
- Keep Web K `open` and `send` disabled until verified action support exists.
- Require `--apply` for login, open, send, close, and mutating evaluation.
- Publish `tg-web-mirror-hook@0.1.0` before `telegram-web@2.0.0`; the major bump reflects the new mandatory `--apply` mutation gate.
- Never run `tools/publish.js` manually; publish only through immutable tags.
- Complete, verify, commit, rebase, push, and release one skill before starting the next release.

---

### Task 1: Publishable `tg-web-mirror-hook`

**Files:**
- Create: `skills/tg-web-mirror-hook/manifest.json`
- Create: `skills/tg-web-mirror-hook/SKILL.md`
- Create: `skills/tg-web-mirror-hook/README.md`
- Create: `skills/tg-web-mirror-hook/bin/tg-web-mirror-hook`
- Create: `skills/tg-web-mirror-hook/lib/expressions.js`
- Create: `skills/tg-web-mirror-hook/lib/patch.js`
- Create: `skills/tg-web-mirror-hook/references/help.md`
- Create: `skills/tg-web-mirror-hook/references/help.en.md`
- Create: `skills/tg-web-mirror-hook/references/help.cn.md`
- Create: `skills/tg-web-mirror-hook/references/tools.md`
- Create: `skills/tg-web-mirror-hook/references/tools.en.md`
- Create: `skills/tg-web-mirror-hook/references/tools.cn.md`
- Test: `skills/tg-web-mirror-hook/test/cli.test.js`
- Test: `skills/tg-web-mirror-hook/test/expressions.test.js`
- Test: `skills/tg-web-mirror-hook/test/patch.test.js`

**Interfaces:**
- Consumes: `agent-electron webcontents`, `agent-electron cdp`, and target IDs shaped as `wc:<webContentsId>`.
- Produces: CLI commands `status`, `install`, and `verify`; JSON results with `ok`, `operation`, `changed`, `verified`, cache marker state, and runtime mirror state.

- [ ] **Step 1: Add only the promoted tests and confirm the public skill is absent**

Promote the three tests from `/home/cicy/cicy-ai/skills/private/tg-web-mirror-hook/test/` into `skills/tg-web-mirror-hook/test/`, without copying `bin/` or `lib/` yet.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
NODE_OPTIONS=--experimental-vm-modules node --test skills/tg-web-mirror-hook/test/*.test.js
```

Expected: FAIL because `../lib/expressions.js`, `../lib/patch.js`, and `../bin/tg-web-mirror-hook` do not exist in the public package.

- [ ] **Step 3: Promote the minimal implementation and public metadata**

Promote the private `bin/`, `lib/`, references, `README.md`, and `SKILL.md`. Adapt `manifest.json` to public metadata:

```json
{
  "name": "tg-web-mirror-hook",
  "version": "0.1.0",
  "category": "dev",
  "author": "cicy-ai",
  "homepage": "https://github.com/cicy-ai/cicy-skills/tree/main/skills/tg-web-mirror-hook",
  "license": "MIT",
  "runtime": { "node": ">=22" },
  "system_requirements": ["agent-electron"],
  "npm_dependencies": false,
  "entry": "bin/tg-web-mirror-hook",
  "permissions": ["network"]
}
```

Retain the remaining schema fields from the private manifest, ensure its description exactly matches `SKILL.md`, and keep the executable mode on `bin/tg-web-mirror-hook`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
NODE_OPTIONS=--experimental-vm-modules node --test skills/tg-web-mirror-hook/test/*.test.js
node tools/validate-skill.js skills/tg-web-mirror-hook
node tools/test-skill.js skills/tg-web-mirror-hook
```

Expected: 12 Node tests pass; both repository commands exit 0.

- [ ] **Step 5: Scan the public package and commit**

Run:

```bash
rg -n -i '(api[_-]?token|authorization|cookie|password|/Users/|/home/cicy|BEGIN [A-Z ]+PRIVATE KEY)' skills/tg-web-mirror-hook
git diff --check
git status --short
```

Expected: only synthetic test strings or explicit safety documentation, no credential value or user-specific path. Review every match, then commit:

```bash
git add skills/tg-web-mirror-hook
git commit -m "feat(tg-web-mirror-hook): publish Electron mirror injection"
git fetch origin main
git rebase origin/main
git push origin main
```

- [ ] **Step 6: Release and monitor `tg-web-mirror-hook@0.1.0`**

Run:

```bash
git tag -a tg-web-mirror-hook-v0.1.0 -m "tg-web-mirror-hook v0.1.0"
git push origin refs/tags/tg-web-mirror-hook-v0.1.0
github gh --account cicy-ai run list --repo cicy-ai/cicy-skills --workflow publish.yml --limit 5
```

Wait for the tag run to finish successfully. Confirm the GitHub release asset exists and the public registry reports `0.1.0` before starting Task 2.

### Task 2: Upgrade public `telegram-web` to A/K

**Files:**
- Modify: `skills/telegram-web/manifest.json`
- Modify: `skills/telegram-web/SKILL.md`
- Modify: `skills/telegram-web/README.md`
- Modify: `skills/telegram-web/bin/telegram-web`
- Create: `skills/telegram-web/lib/args.js`
- Create: `skills/telegram-web/lib/backend-a.js`
- Create: `skills/telegram-web/lib/backend-k.js`
- Create: `skills/telegram-web/lib/errors.js`
- Create: `skills/telegram-web/lib/login.js`
- Create: `skills/telegram-web/lib/normalize.js`
- Create: `skills/telegram-web/lib/safety.js`
- Create: `skills/telegram-web/lib/session.js`
- Create: `skills/telegram-web/lib/targets.js`
- Create: `skills/telegram-web/lib/transport.js`
- Modify: `skills/telegram-web/references/help.md`
- Modify: `skills/telegram-web/references/help.en.md`
- Modify: `skills/telegram-web/references/help.cn.md`
- Create: `skills/telegram-web/references/tools.md`
- Create: `skills/telegram-web/references/tools.en.md`
- Create: `skills/telegram-web/references/tools.cn.md`
- Replace tests with: `skills/telegram-web/test/args-safety.test.js`
- Replace tests with: `skills/telegram-web/test/backend-a.test.js`
- Replace tests with: `skills/telegram-web/test/backend-k.test.js`
- Replace tests with: `skills/telegram-web/test/login-cli.test.js`
- Replace tests with: `skills/telegram-web/test/transport-target-session.test.js`

**Interfaces:**
- Consumes: `agent-electron`, `agent-chrome`, and `tg-web-mirror-hook` CLIs through argv-array transports.
- Produces: `status`, `login`, `patch`, `account`, `chats`, `dialogs`, `users`, `messages`, `open`, `send`, `eval`, and `close`; stable `{ok,data}` or `{ok:false,error}` JSON envelopes.

- [ ] **Step 1: Promote only the modular tests and add the public no-proxy assertion**

Replace `skills/telegram-web/test/test.js` with the five private test files. In `args-safety.test.js`, assert the public default explicitly:

```js
const parsed = parseArgs(['login']);
assert.equal(parsed.options.proxy, null);
```

Update login test fixtures so no-proxy is the default and explicit `--proxy socks5://127.0.0.1:9001` is tested only as caller input.

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
node --test skills/telegram-web/test/*.test.js
```

Expected: FAIL because the old monolithic public CLI does not provide the promoted `lib/` modules and does not implement the required A/K contract.

- [ ] **Step 3: Promote the modular implementation**

Promote `bin/`, `lib/`, references, `README.md`, and `SKILL.md` from `/home/cicy/cicy-ai/skills/private/telegram-web/`. In `lib/args.js`, define the default as:

```js
const DEFAULT_PROXY = null;
```

Ensure `login.js` calls proxy configuration only when `options.proxy` is a non-empty string, while `--no-proxy` also resolves to `null`. Preserve argv-array subprocess calls, `--apply` mutation gates, frozen read-only evaluation, platform target validation, and secret-like session-key rejection.

- [ ] **Step 4: Upgrade public manifest to `2.0.0`**

Set:

```json
{
  "name": "telegram-web",
  "version": "2.0.0",
  "category": "productivity",
  "author": "cicy-ai",
  "homepage": "https://github.com/cicy-ai/cicy-skills/tree/main/skills/telegram-web",
  "system_requirements": ["agent-electron", "agent-chrome", "tg-web-mirror-hook"],
  "permissions": ["network", "filesystem:home"]
}
```

Retain schema-required fields, make manifest and `SKILL.md` descriptions identical, and describe Web K read-only mutation limits in both languages.

- [ ] **Step 5: Run tests, validation, and safety scans**

Run:

```bash
node --test skills/telegram-web/test/*.test.js
node tools/validate-skill.js skills/telegram-web
node tools/test-skill.js skills/telegram-web
rg -n -i '(api[_-]?token|authorization|cookie|password|/Users/|/home/cicy|BEGIN [A-Z ]+PRIVATE KEY)' skills/telegram-web
git diff --check
```

Expected: 31 Node tests pass; validation and repository harness exit 0; every scan match is a synthetic fixture or an explicit prohibition, never a credential or machine path.

- [ ] **Step 6: Commit, rebase, and push**

Run:

```bash
git add skills/telegram-web
git commit -m "feat(telegram-web): support safe Telegram Web A and K automation"
git fetch origin main
git rebase origin/main
git push origin main
git status --short --branch
```

Expected: clean `main` aligned with `origin/main`.

- [ ] **Step 7: Release and monitor `telegram-web@2.0.0`**

Run:

```bash
git tag -a telegram-web-v2.0.0 -m "telegram-web v2.0.0"
git push origin refs/tags/telegram-web-v2.0.0
github gh --account cicy-ai run list --repo cicy-ai/cicy-skills --workflow publish.yml --limit 5
```

Wait for success, then confirm the release asset and public registry version are `2.0.0`.

### Task 3: Final cross-package verification

**Files:**
- Verify: `skills/tg-web-mirror-hook/**`
- Verify: `skills/telegram-web/**`

**Interfaces:**
- Consumes: the two tagged public packages.
- Produces: evidence that dependency order, repository state, releases, and registry entries are complete.

- [ ] **Step 1: Run both local suites from the pushed `main`**

```bash
git fetch origin main
git rebase origin/main
NODE_OPTIONS=--experimental-vm-modules node --test skills/tg-web-mirror-hook/test/*.test.js
node --test skills/telegram-web/test/*.test.js
node tools/validate-skill.js skills/tg-web-mirror-hook
node tools/validate-skill.js skills/telegram-web
git diff --check
git status --short --branch
```

Expected: all tests and validators pass; worktree is clean and aligned with `origin/main`.

- [ ] **Step 2: Confirm remote publication state**

Use `github gh --account cicy-ai` to verify both tag workflow runs succeeded and both GitHub releases contain their zip assets. Query the public registry without authentication and verify exact versions `0.1.0` and `2.0.0`. Report any unavailable live Mac Electron verification separately from the completed package tests.

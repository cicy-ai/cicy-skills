# Telegram Web Public Skills Design

## Goal

Publish the proven Mac Telegram Web automation as two reusable public skills without publishing credentials, machine-specific paths, profile identities, or proxy assumptions.

The existing public `telegram-web` skill is version `1.0.2` and supports Telegram Web A through an older monolithic implementation. The private Mac implementation adds Telegram Web K, stricter mutation gates, normalized output, safer session persistence, and a separately testable Electron cache injection hook.

## Public packages

### `tg-web-mirror-hook` `0.1.0`

Add a new public skill that installs, verifies, and upgrades the Telegram Web K mirror hook through `agent-electron`.

- Keep the Electron/CDP injection and cached JavaScript patch isolated from Telegram account operations.
- Require unambiguous target selection, a unique patch anchor, parseable generated JavaScript, runtime verification, and idempotent second installation.
- Never read or emit Telegram authentication storage.
- Depend only on the public `agent-electron` skill and Node.js 22 or newer.

### `telegram-web` `1.1.0`

Replace the public `1.0.2` implementation with the tested private implementation while preserving the public skill name.

- Support Telegram Web A and K behind one stable JSON CLI.
- Delegate Web K injection to `tg-web-mirror-hook`.
- Use `agent-electron` for Electron operations and `agent-chrome` only for explicitly approved login transfer.
- Require `--apply` for login, open, send, close, and mutating evaluation.
- Persist only target metadata; reject secret-like session fields.
- Keep normalized account, chat, dialog, user, and message output.
- Leave unsupported Web K mutations disabled until a verified action capability exists.

## Public-safety changes

- Change the login proxy default from `socks5://127.0.0.1:9001` to no proxy. A caller must pass `--proxy URL` explicitly when required.
- Keep profile and Electron account indices configurable; describe defaults as convenience values, not environment requirements.
- Remove private registry assumptions and local-machine examples.
- Scan every published file for tokens, cookies, passwords, authorization headers, user-specific absolute paths, and credential fixtures.
- Do not bundle session files, browser storage, generated cache contents, or live Telegram data.

## Source and repository layout

Promote the private source into the existing public repository:

```text
skills/tg-web-mirror-hook/
skills/telegram-web/
```

Keep the CiCy public package shape already used by the repository: `manifest.json`, `SKILL.md`, `README.md`, `bin/`, `lib/`, `references/`, and `test/`. The public `telegram-web` directory is upgraded in place; the mirror hook is new.

## Verification

Work on one skill at a time.

1. Record baseline failures against the old public `telegram-web` behavior and the absence of `tg-web-mirror-hook`.
2. Add or promote focused tests before production changes.
3. Run each skill's Node tests, repository validation, secret/path scans, executable permission checks, and `git diff --check`.
4. Run the repository's skill validator and test harness for each package.
5. Where a live Mac Electron target is unavailable, treat unit/integration tests as the release gate and report the missing live check explicitly. Do not claim a live Mac verification that did not run.

## Release sequence

1. Publish `tg-web-mirror-hook` first with tag `tg-web-mirror-hook-v0.1.0`.
2. After its workflow succeeds, publish `telegram-web` with tag `telegram-web-v1.1.0`.
3. Monitor both GitHub Actions runs and confirm registry versions and release artifacts.

Each version is immutable. If a tagged publication fails after registry acceptance or its artifact changes, bump the affected version instead of overwriting or force-pushing.

## Non-goals

- Do not publish any Telegram account data or automate phone, QR, login-code, or 2FA entry.
- Do not add Web K send/open support without a separately verified implementation.
- Do not modify `agent-electron` or `agent-chrome` unless validation reveals a concrete compatibility defect.
- Do not preserve the old monolithic implementation as a second command or compatibility layer.

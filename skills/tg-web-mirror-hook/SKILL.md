---
name: tg-web-mirror-hook
description: Use when Telegram Web K needs window.__mirrors exposed, its apiManagerProxy cache changed, or an existing mirror hook must be installed, upgraded, or verified through agent-electron.
---

# TG Web Mirror Hook

Safely expose Telegram Web K's internal mirror registry from its cached `apiManagerProxy-*.js` bundle. Use the bundled command; do not recreate the cache rewrite ad hoc.

**REQUIRED SUB-SKILL:** Use `agent-electron` for target selection and Electron/CDP safety rules.

## Workflow

1. Confirm cicy-desktop is connected and Telegram Web K is already open. Never open a duplicate window.
2. Run `status` first. If multiple TG targets exist, select the intended `wc:<webContentsId>` explicitly.
3. Run `install`. It must find exactly one active bundle and one patch anchor; any ambiguity stops without writing.
4. Require `verified: true`. This proves one matching cache marker and a non-empty object at `window.__mirrors` after reload.
5. Run `install` a second time after changes to prove `changed: false`; this confirms idempotency and avoids a reload loop.

The command preserves Response status, status text, and headers. It upgrades marked older versions and adopts the known legacy unmarked assignment without duplication. It never takes screenshots.

## Commands

```sh
tg-web-mirror-hook status --client <client_id>
tg-web-mirror-hook install --client <client_id>
tg-web-mirror-hook verify --client <client_id>
tg-web-mirror-hook install --client <client_id> --target wc:5 --json
```

Stop and report the exact invariant error if the bundle is missing, targets are ambiguous, markers are malformed, or the generated bundle fails JavaScript parsing. Do not weaken anchor checks to force an install.

## References

- Read [help.cn.md](./references/help.cn.md) for commands, outputs, and recovery.
- Read [tools.cn.md](./references/tools.cn.md) for target identifiers, CDP boundaries, and files.

---
name: tg-web-mirror-hook
description: Use when Telegram Web K needs window.__mirrors exposed, its host injection script installed, or its apiManagerProxy cache changed and verified.
---

# TG Web Mirror Hook

Safely expose Telegram Web K's internal mirror registry from its cached `apiManagerProxy-*.js` bundle. Use the bundled command; do not recreate the cache rewrite ad hoc.

**REQUIRED SUB-SKILL:** Use `agent-electron` for target selection and Electron/CDP safety rules (local `--client` mode).

Use `agent-desktop` for local `host-install`, which saves the bundled readable
`telegram.org.js` to the connected Desktop user's fixed injection directory.

**Fleet mode (`--host`)** reaches remote cicy-desktop machines over the realtime
control plane (`~/cicy-ai/db/desktop-ctrl.json`, the same file `wsd` and
`tg-matrix` use). Matrix-panel cells are BrowserViews and never run the
domain-inject script, so in fleet mode `install`/`verify`/`status` apply the
cache patch directly inside every Telegram Web K webContents of the machine.

## Workflow

1. Confirm cicy-desktop is connected and Telegram Web K is already open. Never open a duplicate window.
2. Run `status` first. If multiple TG targets exist, select the intended `wc:<webContentsId>` explicitly.
3. Run `install`. It must find exactly one active bundle and one patch anchor; any ambiguity stops without writing.
4. Require `verified: true`. This proves one matching cache marker and a non-empty object at `window.__mirrors` after reload.
5. Run `install` a second time after changes to prove `changed: false`; this confirms idempotency and avoids a reload loop.

The command preserves Response status, status text, and headers. It upgrades marked older versions and adopts the known legacy unmarked assignment without duplication. It never takes screenshots.

## Commands

```sh
# local Desktop connected to this cicy-code (agent-desktop / agent-electron)
tg-web-mirror-hook host-install --client <client_id>
tg-web-mirror-hook status --client <client_id>
tg-web-mirror-hook install --client <client_id>
tg-web-mirror-hook verify --client <client_id>
tg-web-mirror-hook install --client <client_id> --target wc:5 --json

# fleet machines (matrix hosts) over the control plane
tg-web-mirror-hook host-install --host all
tg-web-mirror-hook install --host xs-3006
tg-web-mirror-hook verify --host xs-3006,xs-3007 --json
tg-web-mirror-hook install --host xs-3006 --target wc:41
```

Run `host-install` when provisioning a Desktop host. It resolves that host's
home directory and writes only
`~/cicy-ai/electron/extension/inject/telegram.org.js` (the directory
cicy-desktop's domain-inject loader reads; `~/data/electron` is the pre-2.1.3xx
location and is no longer read). This covers BrowserWindow tabs that open
Telegram; for matrix cells use `install --host`.

Stop and report the exact invariant error if the bundle is missing, targets are ambiguous, markers are malformed, or the generated bundle fails JavaScript parsing. Do not weaken anchor checks to force an install.

## References

- Read [help.cn.md](./references/help.cn.md) for commands, outputs, and recovery.
- Read [tools.cn.md](./references/tools.cn.md) for target identifiers, CDP boundaries, and files.

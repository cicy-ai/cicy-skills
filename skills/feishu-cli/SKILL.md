---
name: feishu-cli
description: Install and configure the official Feishu/Lark CLI (@larksuite/cli) on this host. Bootstrap-only wrapper: install / config / auth / status. For real API calls use the native lark-cli.
---

# Feishu CLI

> **Two different commands. Pick the right one:**
>
> - `feishu-cli` — **bootstrap wrapper only**. Four subcommands: `install` / `config` / `auth` / `status`. **Nothing else.**
> - `lark-cli` — **the official Feishu/Lark CLI**. Use this for every real API call: Messenger, Docs, Base, Sheets, Calendar, Mail, Tasks, Meetings, …
>
> If a task is "install / set up credentials / log in / check setup state" → use `feishu-cli`.
> If a task is "do anything against the Feishu/Lark Open Platform" → use `lark-cli` directly.
> **The wrapper does NOT proxy `lark-cli im ...` calls.** Do not try `feishu-cli im ...`.

## Four jobs

1. `install` — install the official `lark-cli` binary via `npx @larksuite/cli@latest install`.
2. `config`  — run `lark-cli config init` to set the app id/secret (interactive, one-time).
3. `auth`    — run `lark-cli auth login --recommend`; prints an OAuth **authorization URL**.
4. `status`  — report install state (+ version) and auth state.

## Credentials: hard rules

- `lark-cli` stores credentials in the **OS-native keychain** when one is available,
  and **downgrades to a local file** (`~/.lark-cli/config.json`) on headless hosts
  without a keychain (most Linux servers). Either way there is intentionally **no**
  `~/cicy-ai/db/feishu-cli.json` — lark-cli owns its own credential store.
- **NEVER** print/cat/grep `~/.lark-cli/config.json`, and never ask the user to paste
  an app secret or token into chat. `feishu-cli config` drives the CLI's guided setup.
- `feishu-cli auth` prints an authorization URL. **Relay that URL to the user** so
  they can approve in a browser; do not attempt to complete OAuth yourself.

## Proxy: China-brand endpoints need a direct route

`lark-cli` talks to `*.feishu.cn` (the `feishu` brand; the `lark` brand uses
`*.larksuite.com`). On hosts whose HTTP(S) proxy exits **outside mainland China**
(e.g. a HK mihomo exit), the feishu.cn endpoints reset the connection — you'll see
`EOF` on `config init` / `auth login` and on real API calls. Strip the proxy so
lark-cli uses the host's direct egress:

```sh
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy \
  NO_PROXY="feishu.cn,larksuite.com" lark-cli ...
```

This applies to `feishu-cli config` / `feishu-cli auth` as well. A persistent fix is a
proxy rule routing `feishu.cn` DIRECT.

## Bootstrap

```sh
feishu-cli status              # is lark-cli installed? authenticated?
feishu-cli install             # install the official lark-cli
feishu-cli config              # set app credentials (lark-cli config init)
feishu-cli auth                # OAuth login (prints URL to relay to the user)
feishu-cli status              # confirm authenticated
```

## Running from an AI agent (non-blocking)

`config` and `auth` are interactive. The native CLI supports non-blocking variants —
pass them through after `--` and run the command in the background, then extract the
printed authorization URL and send it to the user:

```sh
feishu-cli config -- --new        # → lark-cli config init --new
feishu-cli auth   -- --no-wait    # → lark-cli auth login --no-wait
```

## After setup — use the native lark-cli

```sh
lark-cli im +messages-send --chat-id oc_xxx --text "Hello"
lark-cli calendar calendars list
lark-cli api GET /open-apis/calendar/v4/calendars --format json
```

See `references/help.md` for the full command list and `references/tools.md` for the
subcommand → lark-cli mapping.

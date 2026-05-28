---
name: feishu-cli
description: Install, configure and run the official Feishu/Lark CLI (@larksuite/cli): install/config/auth/status; `run` forwards any lark-cli command with the feishu.cn proxy bypass auto-handled.
---

# Feishu CLI

Wrapper around the official Feishu/Lark CLI — [`@larksuite/cli`](https://github.com/larksuite/cli)
(binary `lark-cli`). It bootstraps the CLI **and** gives a single proxy-aware entry
point so you never type the `env -u HTTP_PROXY ... lark-cli` dance.

> **One rule of thumb:** drive everything through `feishu-cli`.
> - bootstrap/inspect → `install` / `config` / `auth` / `status`
> - any real API call → `feishu-cli run <lark-cli args…>` (proxy bypass auto-handled)
>
> You *can* still call `lark-cli` directly, but then you must add the proxy bypass
> yourself (see "Proxy" below). `feishu-cli run` does it for you.

## Commands

1. `install` — install the official `lark-cli` binary via `npx @larksuite/cli@latest install`.
2. `config`  — run `lark-cli config init` to set the app id/secret (interactive, one-time).
3. `auth`    — run `lark-cli auth login --recommend`; prints an OAuth **authorization URL**.
4. `status`  — report install state (+ version) and auth state.
5. `run`     — forward any `lark-cli` command, with the proxy bypass applied. Exit code
   and output pass through unchanged. Alias: `x`.

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
`EOF` on `config init` / `auth login` and on real API calls.

**`feishu-cli` handles this for you.** Every command it runs (`config`, `auth`,
`status`, and `run`) strips the proxy env vars and adds the feishu/lark domains to
`NO_PROXY`, so lark-cli uses the host's direct egress. Opt out with
`FEISHU_CLI_KEEP_PROXY=1` (for a host that can only reach the internet via a proxy).

Only if you bypass the wrapper and call `lark-cli` directly do you need the manual
prefix:

```sh
env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy \
  NO_PROXY="feishu.cn,larksuite.com" lark-cli ...
```

A persistent host-level fix is a proxy rule routing `feishu.cn` DIRECT.

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

## After setup — run real commands via `feishu-cli run`

```sh
feishu-cli run sheets +create --title "T" --headers '["A","B"]' --data '[["1","2"]]'
feishu-cli run im +messages-send --chat-id oc_xxx --text "Hello"
feishu-cli run calendar +agenda
feishu-cli run api GET /open-apis/calendar/v4/calendars --format json
```

Everything after `run` is passed verbatim to `lark-cli`, so the full surface (200+
commands across im, calendar, docs, base, sheets, mail, task, wiki, vc, …) is
available — just without the proxy/env friction. Use `--` before the lark args if any
collide with `feishu-cli`'s own flags: `feishu-cli run -- status --json`.

See `references/help.md` for the full command list and `references/tools.md` for the
subcommand → lark-cli mapping.

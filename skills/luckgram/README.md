# luckgram — Telegram accounts in Luckgram Desktop, from the command line

> Source-only Node.js, zero dependencies. Read [`bin/luckgram`](./bin/luckgram).

[Luckgram Desktop](https://luckgram.cc/) has an MCP server built in. This skill is a command for it: an agent (or you) lists the logged-in accounts, reads chats, sends a message, adds a friend — on this computer, or on every computer of a cloud key.

## What it does

- `luckgram accounts` / `active` / `switch` — the logged-in accounts
- `luckgram friends list | find | add | remove`
- `luckgram chats list | read`
- `luckgram messages get | send`
- `luckgram groups join | leave`, `luckgram profile set`
- `luckgram devices`, `luckgram calls` — the cloud: computers and the audit list
- `luckgram status` — what is configured (tokens masked) and whether it answers

Each group of commands is a skill the user switches on **per account** inside Luckgram Desktop; everything is off at first, and commands that change an account are rate limited there. See <https://luckgram.cc/skills/>.

## Install

```bash
cicy-code skill install luckgram
```

## Configure

In Luckgram Desktop: Settings → Luckgram → **Local MCP server** → switch on → *Copy access token*.

```bash
luckgram config --local --token-stdin     # paste the token, Enter, Ctrl-D
luckgram status
luckgram accounts
```

For the cloud (several computers at one address): *Connect through the cloud* → *Copy cloud key*, then `luckgram config --cloud --token-stdin`.

## Security

- The token is read from stdin only and stored in `~/cicy-ai/db/luckgram.json` with mode 0600.
- No command prints it; `status` masks it.
- The only hosts contacted are the address you configured (`127.0.0.1`, `mcp.luckgram.cc` or its backup `lg-mcp.cat158.com`).

## Test

```bash
node tools/test-skill.js skills/luckgram
```

The tests start a small MCP server on a free local port and run the command against it.

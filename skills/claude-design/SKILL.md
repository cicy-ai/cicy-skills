---
name: claude-design
description: Drive claude.ai/design from the CLI via agent-chrome CDP: open a workspace, send prompts (UTF-8 safe), and trigger Share→Export downloads.
---

# Claude Design

A thin CLI wrapper around `agent-chrome` that turns the **claude.ai/design** web
UI into a scriptable target. Lets you (or another agent) open a Claude Design
workspace, fire a prompt at the composer, and pull the exported HTML — without
hand-rolling CDP every time.

> **One rule of thumb:** drive every claude.ai/design interaction through
> `claude-design`. It bakes in the three things that are easy to get wrong when
> you script the page directly:
> 1. **UTF-8** decoding for prompts that contain Chinese / Japanese — `atob()`
>    returns Latin-1 bytes; you MUST go through `TextDecoder('utf-8')` or the
>    composer fills with mojibake. (Symptom check: the page shows `ä¸­æ–‡` instead
>    of `中文`.)
> 2. **React-aware** textarea setter — assigning `t.value = "..."` does NOT
>    notify React; the send button stays disabled. You need to invoke the
>    prototype setter and dispatch a synthetic `input` event.
> 3. **Stable selectors** for the composer (`textarea[data-testid="chat-composer-input"]`)
>    and send button (`[data-testid="chat-send-button"]`), with `--wait` to poll
>    the send button's `disabled` state as a done signal.

## Dependencies

- **`agent-chrome`** on PATH (the agent-chrome skill must be installed).
- A Chrome profile registered in `~/Private/chrome.json` (or on the remote
  agent-chrome client) where you've **already logged into claude.ai**. The skill
  does **not** drive login — that's a one-time human step.

## Commands

1. `open`     — launch the profile + navigate to `claude.ai/design`.
2. `new`      — `Page.navigate` to the `/design` landing (project list).
3. `create`   — pick template + mode, fill project name, click Create, wait
   for the redirect into the new project. Use this before `prompt` (the
   landing page has no chat composer).
4. `prompt`   — inject + send a prompt. Source can be positional, stdin (`-`),
   or `--file <path>`. Pass `--wait` to block until the assistant finishes
   (= send button re-enabled). Fails fast if you're still on the landing
   page — run `create` first.
5. `download` — click Share → Export, return the on-disk path on the host.
   `--type` selects which export menu item (`editable`, `standalone`, `zip`).
6. `exec`     — raw `Runtime.evaluate` for one-off debugging.
7. `status`   — report whether the profile is running and whether
   claude.ai/design is currently loaded.

## Global flags

Every subcommand accepts:

- `--idx <n>` — chrome account index (= the slot in `~/Private/chrome.json`).
  Required. Can be set via env `CLAUDE_DESIGN_IDX`.
- `--client <id>` — agent-chrome client (for remote desktops). Omit for local.
  Can be set via env `CLAUDE_DESIGN_CLIENT`.

## Quickstart

```sh
# Pick the chrome profile to use (one that's already logged into claude.ai)
export CLAUDE_DESIGN_IDX=6
export CLAUDE_DESIGN_CLIENT=web-w-1001-mphqbqi5-aronzx   # omit for local

claude-design open                                # launches Chrome + opens /design
claude-design create "CiCy AI Landing" --mode hifi # → returns /design/p/<uuid>
claude-design status                              # confirm composer is mounted

cat <<'EOF' | claude-design prompt - --wait
设计一个深色科技风格的落地页,主标题"CiCy AI",支持中英日 i18n,
要有一个旋转的地球可视化,导航包含 Download / Skills / Agents。
EOF
# → blocks until the assistant finishes generating; exit 0 on completion

claude-design download --type editable --out /Users/you/Downloads
# → the file lands at /Users/you/Downloads/<project>.html on the host
```

## What this skill does NOT do

- It does **not** pull files off the host. The export lands on whichever
  machine `agent-chrome` is talking to. For a remote Mac, use `cicy-agent` to
  shell into the Mac and chunk the file back with `dd | base64` (see
  [references/pull.md](references/pull.md) for the proven recipe — the WS
  payload limit is ~1 MB so anything bigger needs chunking).
- It does **not** drive login. Authenticate the profile once via a real human
  browser session, then close it and let the skill take over.
- It does **not** parse the rendered design output. `prompt --wait` only tells
  you the assistant finished; if you need to inspect what it produced, use
  `exec` or trigger `download`.

## See also

- `references/help.md` — full command reference.
- `references/tools.md` — subcommand → underlying agent-chrome CDP call.
- `references/pull.md` — chunked file pull recipe (works around the 1 MB WS limit).

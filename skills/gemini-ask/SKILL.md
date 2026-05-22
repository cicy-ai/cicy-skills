---
name: gemini-ask
description: Ask Google Gemini in a connected cicy-desktop window via desktop_event WebSocket RPC. Returns the assistant text.
---

# Gemini Ask

Local `gemini-ask` wrapper that pushes a `desktop_event { gemini_ask, prompt, win_id, requestId }`
to a connected cicy-desktop client and awaits `gemini_ask_result`.

The desktop side (cicy-desktop) types the prompt into a Gemini browser window
and reads back the answer.

## Scope

Use this skill when the task involves a one-shot Gemini question and a
cicy-desktop client is connected.

## Rules

1. `gemini-ask <prompt>` defaults to `win_id=4`.
2. Pass an explicit `win_id` if multiple Gemini windows are open: `gemini-ask "..." 6`.
3. Result is whatever cicy-desktop scrapes from the page — formatting may vary.
4. For a true API call, use the `google` skill or a real Gemini SDK.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)

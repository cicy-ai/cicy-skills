---
name: eng
description: One-shot English correction wrapper. POSTs the input text to cicy-code's /api/ai/correct endpoint and prints the corrected version.
---

# Eng

Local `eng` wrapper that calls cicy-code's `/api/ai/correct` for English
correction.

## Scope

Use this skill when the user asks to:

- correct grammar / spelling / fluency in English text
- "polish" or "rewrite" a short English passage
- check English usage in a sentence

Read input from positional args or stdin. Prints the corrected text.

## Rules

1. Input may be passed as args (`eng "this is grammer"`) or piped on stdin (`echo … | eng`).
2. The wrapper does not preserve history — each call is independent.
3. For multi-turn correction or longer drafts, prefer `gpt-chat`.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)

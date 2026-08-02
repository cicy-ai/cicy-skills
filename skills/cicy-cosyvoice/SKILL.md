---
name: cicy-cosyvoice
description: Install and run CosyVoice voice-cloning TTS inside a remote cicy-code agent on Google Colab or a Linux GPU instance.
---

# Cicy CosyVoice

Use this skill on the remote GPU worker, not on the local orchestration host.

1. Run `cicy-cosyvoice doctor`; require `ok:true` before a paid install.
2. Run `cicy-cosyvoice install`. It is idempotent and writes `READY.json` only after model import succeeds.
3. Run `cicy-cosyvoice run --ref /absolute/ref.wav --ref-text 'reference words' --text 'target words'`.
4. Return the absolute `result.audio` path to the requesting koubo agent.

The reference audio should be clean speech, ideally 3–10 seconds, and its transcript must match. Never claim completion until the output exists and is non-empty. Read [references/tools.md](references/tools.md) for the shared runtime contract.

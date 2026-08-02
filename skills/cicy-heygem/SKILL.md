---
name: cicy-heygem
description: Install and run experimental HeyGem lip-sync video generation inside a remote cicy-code agent on Colab or a Linux GPU instance.
---

# Cicy HeyGem

Use HeyGem only when the user selects it and the remote GPU has at least 15 GB VRAM; 16 GB or more is preferred. It is experimental and may be less portable than MuseTalk.

1. Run `cicy-heygem doctor`, then `cicy-heygem install`.
2. Run `cicy-heygem run /absolute/base.mp4 /absolute/voice.wav`.
3. Return the absolute `result.video` path only after probing the file.

Inference is serialized because the upstream runtime uses shared repository output paths. Read [references/tools.md](references/tools.md) for the runtime contract and recovery rules.

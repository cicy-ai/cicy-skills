---
name: cicy-whisper
description: Install and run faster-whisper transcription inside a remote cicy-code agent on Google Colab or a Linux compute instance.
---

# Cicy Whisper

Use this skill to transcribe source audio/video before rewriting, voice cloning, subtitles, or spoken-video generation.

1. Run `cicy-whisper doctor`, then `cicy-whisper install`.
2. Run `cicy-whisper run /absolute/input.mp4 --model large-v3-turbo --language zh`.
3. Return the absolute TXT, SRT, and JSON paths from the result.

Whisper may run on CPU; CUDA is selected automatically when present. Prefer `large-v3-turbo` for GPU workers and `small` when resources are constrained. Read [references/tools.md](references/tools.md) for the runtime contract.

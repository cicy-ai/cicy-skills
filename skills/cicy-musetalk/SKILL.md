---
name: cicy-musetalk
description: Install and run MuseTalk lip-sync video generation inside a remote cicy-code agent on Google Colab or a Linux GPU instance.
---

# Cicy MuseTalk

Use this skill on the remote GPU worker after speech audio exists.

1. Run `cicy-musetalk doctor`, then `cicy-musetalk install` when needed.
2. Run `cicy-musetalk run /absolute/base.mp4 /absolute/voice.wav`.
3. Return the absolute `result.video` path only after ffprobe can read it.

One inference runs per worker at a time. Every job uses a distinct directory and inference YAML. The bundled whisper-tiny is a MuseTalk feature extractor, not the user transcription engine; use `cicy-whisper` for transcripts. Read [references/tools.md](references/tools.md) for the runtime contract.

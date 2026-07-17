---
name: whisper
description: Local offline speech-to-text CLI (whisper.cpp): install whisper-cli to ~/.local/bin, pull ggml models with resume + mirror, transcribe audio/video to txt/srt/vtt/json.
---

# Whisper

Local, offline, free speech-to-text built on [whisper.cpp](https://github.com/ggerganov/whisper.cpp).
No API key, no network at transcription time — audio never leaves the machine.

Use this when the task is: transcribe a local audio/video file, add subtitles,
turn a voice memo / meeting recording into text, or set up offline STT on a
host. For cloud STT (Groq whisper API etc.) other skills like `douyin-dl`
already cover that; this skill is the **offline** path.

## Quick start

```sh
whisper install                 # whisper-cli → ~/.local/bin + base model (141MB)
whisper 会议录音.m4a --lang zh    # → transcript on stdout
whisper transcribe talk.mp4 --srt   # → talk.srt next to the input
```

## Commands

```sh
whisper transcribe <file…> [-m base] [-l auto] [--srt|--vtt|--json|--txt] [-o out]
whisper <file> [options]        # shortcut for transcribe
whisper install [--model base]  # binary + default model; idempotent
whisper models                  # catalog + what's installed
whisper pull <model>            # download (resumable; hf-mirror.com first)
whisper rm <model>
whisper status
```

## Choosing a model

| model | download | notes |
|---|---|---|
| tiny | 75MB | fastest, rough |
| base | 141MB | default, fine for daily notes |
| small | 466MB | noticeably better Chinese — best value |
| medium | 1.5GB | accurate, slow |
| large-v3 | 2.9GB | best, slowest |
| large-v3-turbo | 1.5GB | near large-v3 quality, much faster |

Models live in `~/.cache/whisper-cpp/` (`WHISPER_MODEL_DIR` overrides).
A missing model is auto-downloaded on first use. Interrupted downloads resume
(`.partial` is kept); a corrupt partial is reset with `whisper rm <model>`.

## Notes

- **Install location**: `whisper-cli` always ends up in `~/.local/bin`.
  Resolution order: existing binary on PATH (symlinked) → `brew install
  whisper-cpp` (macOS/linuxbrew) → **automatic source build** (Linux path:
  needs `git cmake build-essential`; static binary, github → gitee mirror
  fallback, `WHISPER_GIT_REPO` overrides).
- **Input formats**: wav/mp3/flac/ogg are decoded natively; anything else
  (m4a, mp4, webm, amr, …) requires `ffmpeg` on PATH.
- **Accuracy tips**: pass `--lang zh` instead of auto when the language is
  known; pass `--prompt "人名, 术语"` to bias decoding toward domain words.
- Env: `WHISPER_MODEL` (default model), `WHISPER_MODEL_DIR`,
  `WHISPER_HF_BASE` (extra model mirror, tried first).

## References

- [help.md](./references/help.md) — full command reference
- [tools.md](./references/tools.md) — file layout, env vars, exit codes

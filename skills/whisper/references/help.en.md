# whisper — command reference

## transcribe

```
whisper transcribe <file…> [options]
whisper <file> [options]          # shortcut: first arg that is an existing file
```

Prints the plain transcript to **stdout** (progress/noise goes to stderr, so
`whisper a.mp3 > a.txt` is safe). With a format flag it also writes files.

| option | meaning |
|---|---|
| `-m, --model <name>` | model to use (default `base`, or `$WHISPER_MODEL`); auto-downloads if missing |
| `-l, --lang <code>` | spoken language (`zh`, `en`, …; default `auto`) |
| `--srt` `--vtt` `--json` `--txt` `--csv` `--lrc` | write that file next to the input (combinable) |
| `-o, --output <path>` | output path for format files (single input only; extension is derived) |
| `--timestamps` | keep `[00:00:00.000 --> …]` lines in stdout output |
| `--translate` | translate the result to English |
| `--prompt <text>` | initial prompt — seed names/jargon for better accuracy |
| `-t, --threads <n>` | CPU threads |

Multiple files are processed sequentially with the same options.

## install

```
whisper install [--model base] [--no-model]
```

1. Finds `whisper-cli` (already in `~/.local/bin` → done; elsewhere on PATH →
   symlink into `~/.local/bin`; nowhere → `brew install whisper-cpp` then
   symlink; no brew → **automatic source build** — shallow clone of
   whisper.cpp (github, gitee fallback, `WHISPER_GIT_REPO` override), static
   `cmake` build, binary copied to `~/.local/bin`. Needs
   `git cmake build-essential`; missing tools are named in the error).
2. Ensures the default model is downloaded (skip with `--no-model`).
3. Prints `whisper status`.

Idempotent — safe to run repeatedly.

## models / pull / rm

```
whisper models          # catalog with sizes + installed state
whisper pull small      # download; resumes an interrupted .partial
whisper rm small        # delete model (and its .partial)
```

Known models: `tiny tiny.en base base.en small small.en medium medium.en
large-v2 large-v3 large-v3-turbo`. Download sources in order:
`$WHISPER_HF_BASE` (if set) → `hf-mirror.com` → `huggingface.co`.

## status

```
whisper status
```

Shows the resolved `whisper-cli` path + version, ffmpeg presence, model dir,
installed models, and any incomplete `.partial` downloads.

## exit codes

- `0` success
- `1` runtime failure (download failed, whisper-cli/ffmpeg error, not installed)
- `2` usage error (unknown command/option/model, missing file)

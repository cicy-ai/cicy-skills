# whisper — layout / env / dependencies

## File layout

| path | what |
|---|---|
| `~/.local/bin/whisper-cli` | the whisper.cpp binary (symlink created by `whisper install`) |
| `~/.cache/whisper-cpp/ggml-<model>.bin` | downloaded models |
| `~/.cache/whisper-cpp/ggml-<model>.bin.partial` | interrupted download — auto-resumed by `whisper pull` |

No config file and no secrets — the skill is fully offline after models are
downloaded.

## Environment variables

| var | default | meaning |
|---|---|---|
| `WHISPER_MODEL` | `base` | default model for transcribe/install |
| `WHISPER_MODEL_DIR` | `~/.cache/whisper-cpp` | where models live |
| `WHISPER_HF_BASE` | (unset) | extra model mirror base URL, tried before the built-in mirrors |
| `WHISPER_GIT_REPO` | (unset) | whisper.cpp git mirror for the Linux source build |

## External programs

| program | needed for | notes |
|---|---|---|
| `whisper-cli` | transcription | whisper.cpp; installed by `whisper install` |
| `curl` | model download | resume via `-C -` |
| `brew` | install path (macOS/linuxbrew) | preferred when present |
| `git` + `cmake` + C++ toolchain | install path (Linux) | automatic static source build when brew is absent |
| `ffmpeg` | non-native inputs | only for formats other than wav/mp3/flac/ogg |

## stdout / stderr contract

- **stdout**: the transcript (or command output). Safe to redirect/pipe.
- **stderr**: progress, download bars, `✓ file.srt` notices, errors.

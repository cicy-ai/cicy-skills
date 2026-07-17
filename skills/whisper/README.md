# Whisper

Local offline speech-to-text CLI (whisper.cpp): install whisper-cli to
`~/.local/bin`, pull ggml models with resume + mirror, transcribe audio/video
to txt/srt/vtt/json.

```sh
whisper install                    # binary + base model, one command
whisper meeting.m4a --lang zh      # transcript on stdout
whisper transcribe talk.mp4 --srt  # subtitles next to the input
```

- **Offline & free** — no API key, audio never leaves the machine.
- **Resumable model downloads** — hf-mirror.com first, huggingface.co fallback,
  `curl -C -` resume of `.partial` files.
- **Any input** — wav/mp3/flac/ogg natively; m4a/mp4/webm/… via ffmpeg.

See [SKILL.md](./SKILL.md) for the model size table and full docs.

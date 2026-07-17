---
name: ocr
description: Local offline OCR CLI (RapidOCR/ONNX, strong at Chinese): ocr <image> prints the text; --json gives boxes with coordinates and confidence. One-command venv install, no API key.
---

# OCR

Local, offline, free image-to-text built on
[RapidOCR](https://github.com/RapidAI/RapidOCR) (ONNX runtime). Notably strong
at Chinese — the reason the wechat-scrm pipeline picked it. No API key, no
network at recognition time.

Use this when the task is: read text out of a screenshot / photo / scanned
image, locate text by coordinates (`--json`), or set up offline OCR on a host.
Not for PDFs (rasterize pages to images first) and not a hosted service — this
is a pure CLI.

## Quick start

```sh
ocr install                  # one-time: venv + rapidocr_onnxruntime (~60MB incl. models)
ocr screenshot.png           # → recognized text, one line per detected box
ocr a.png b.png c.png        # batch: engine loads once for all three
ocr ui.png --json --min-score 0.6   # boxes: [[x, y, text, score], …]
```

## Commands

```sh
ocr <image…> [--json] [--joined] [--min-score 0.5]
ocr install     # dedicated venv at ~/.cache/ocr-skill/venv; pip mirror fallback
ocr status
```

- **stdout** carries only the recognized text/JSON — safe to pipe.
- `--joined` concatenates all box texts into one blob (no newlines).
- Batch inputs share a single engine load (~2s), so prefer one call with many
  images over many calls.
- Exit codes: `0` ok · `1` runtime/partial failure (bad image reported on
  stderr, batch continues) · `2` usage error.

## Notes

- **Python resolution**: dedicated venv (`~/.cache/ocr-skill/venv`) → system
  `python3` that already has `rapidocr_onnxruntime` → otherwise `ocr install`.
  The venv keeps the system Python untouched; models ship inside the pip
  package, so everything works offline after install.
- **Linux**: needs `python3` + `python3-venv` (`sudo apt install python3
  python3-venv`); everything else is identical to macOS.
- Env: `OCR_PYTHON` (interpreter override), `OCR_VENV_DIR`, `OCR_PIP_INDEX`
  (extra pip mirror, tried first; tuna mirror is the built-in fallback).

## References

- [help.md](./references/help.md) — full command reference
- [tools.md](./references/tools.md) — file layout, env vars, exit codes

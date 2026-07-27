# ocr — command reference

## recognize (default command)

```
ocr <image…> [options]
ocr recognize <image…> [options]   # explicit form
```

Prints recognized text to **stdout** (one line per detected text box, top-left
reading order as returned by the engine). Errors and per-file failures go to
stderr. With multiple inputs each file is prefixed with `── <path>`.

| option | meaning |
|---|---|
| `--json` | full result: `{"<file>": {"boxes": [[x, y, text, score], …]}}` — x/y is the box's top-left corner in pixels |
| `--joined` | concatenate box texts with no separator (useful for matching against expected strings) |
| `--min-score <0-1>` | drop boxes below this confidence (default 0 = keep all) |

Batching: all images in one invocation share a single engine load (~2s);
per-image recognition afterwards is fast. A corrupt/unreadable image reports
on stderr and the batch continues (final exit code 1).

## install

```
ocr install
```

1. If a usable python already exists (venv, or system python3 with
   `rapidocr_onnxruntime` importable) → done, idempotent.
2. Otherwise creates `~/.cache/ocr-skill/venv` and pip-installs
   `rapidocr_onnxruntime` — tries `$OCR_PIP_INDEX` (if set), then PyPI, then
   the tuna mirror.

Debian/Ubuntu prerequisite: `sudo apt install -y python3 python3-venv`.

## status

```
ocr status
```

Shows the resolved interpreter, rapidocr availability, whether it comes from
the dedicated venv or system python, and the venv path.

## exit codes

- `0` success
- `1` runtime failure (not installed, runner crash, or ≥1 image failed in a batch)
- `2` usage error (no/missing input file, unknown option)
- runner-internal: `3` = rapidocr import failed (surfaced as a normal error)

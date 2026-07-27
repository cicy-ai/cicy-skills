# ocr — layout / env / dependencies

## File layout

| path | what |
|---|---|
| `bin/ocr` | the CLI (node, zero npm deps) |
| `bin/ocr_run.py` | the only Python: image paths → JSON boxes, engine loads once per invocation |
| `~/.cache/ocr-skill/venv/` | dedicated venv holding `rapidocr_onnxruntime` (created by `ocr install`) |

No config file and no secrets. ONNX models ship inside the pip package —
fully offline after install.

## Environment variables

| var | default | meaning |
|---|---|---|
| `OCR_PYTHON` | (auto) | interpreter override, checked instead of `python3` on PATH |
| `OCR_VENV_DIR` | `~/.cache/ocr-skill/venv` | where `ocr install` puts the venv |
| `OCR_PIP_INDEX` | (unset) | extra pip index URL, tried before PyPI and the tuna mirror |

## External programs

| program | needed for | notes |
|---|---|---|
| `python3` | everything | 3.8+; debian also needs `python3-venv` for install |
| `pip` (in venv) | install only | mirror fallback built in |

## stdout / stderr contract

- **stdout**: recognized text or `--json` document only. Safe to pipe.
- **stderr**: install progress, per-file errors, usage errors.

## Design note

Pure CLI by design — no resident sidecar. The engine costs ~2s to load, which
a batch invocation amortizes (`ocr *.png`). If a caller needs sub-second
repeated OCR (e.g. a watcher loop), run wechat-scrm's resident sidecar pattern
instead: keep a process alive and POST PNG bytes to it.

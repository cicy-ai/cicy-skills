# OCR

Local offline OCR CLI (RapidOCR/ONNX, strong at Chinese): `ocr <image>` prints
the text; `--json` gives boxes with coordinates and confidence. One-command
venv install, no API key.

```sh
ocr install                 # venv + rapidocr_onnxruntime, one time
ocr screenshot.png          # text on stdout
ocr ui.png --json           # [[x, y, text, score], …] per file
```

- **Offline & free** — models ship in the pip package; nothing leaves the machine.
- **Chinese-strong** — RapidOCR, the same engine the wechat-scrm pipeline uses.
- **Batch-friendly** — many images in one call share a single engine load.

See [SKILL.md](./SKILL.md) for full docs.

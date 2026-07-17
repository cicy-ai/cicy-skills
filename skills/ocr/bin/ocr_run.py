#!/usr/bin/env python3
"""OCR runner: argv = image paths. Prints one JSON object to stdout:
   {"<path>": {"boxes": [[x, y, text, score], ...]} | {"error": "..."}}
The RapidOCR engine loads once per invocation, so batching many images into
one call amortizes the ~2s model load."""
import sys, json

def main():
    paths = sys.argv[1:]
    if not paths:
        print(json.dumps({"error": "no input files"}))
        return 2
    try:
        from rapidocr_onnxruntime import RapidOCR
    except ImportError:
        print(json.dumps({"error": "rapidocr_onnxruntime not installed"}))
        return 3
    eng = RapidOCR()
    out = {}
    for p in paths:
        try:
            res, _ = eng(p)
            boxes = []
            for box, text, score in (res or []):
                boxes.append([int(box[0][0]), int(box[0][1]), text, float(score)])
            out[p] = {"boxes": boxes}
        except Exception as e:  # per-file: one bad image must not kill the batch
            out[p] = {"error": str(e)}
    print(json.dumps(out, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path

from faster_whisper import WhisperModel

parser = argparse.ArgumentParser()
parser.add_argument("input")
parser.add_argument("--model", default="large-v3-turbo")
parser.add_argument("--language", default=None)
parser.add_argument("--device", choices=["auto", "cuda", "cpu"], default="auto")
parser.add_argument("--compute-type", default=None)
parser.add_argument("--out-dir", default=os.environ.get("CICY_JOB_DIR"))
args = parser.parse_args()

source = Path(args.input).expanduser().resolve()
if not source.is_file():
    raise SystemExit(f"input not found: {source}")
out = Path(args.out_dir).expanduser().resolve()
out.mkdir(parents=True, exist_ok=True)
device = args.device
if device == "auto":
    try:
        import ctranslate2
        device = "cuda" if ctranslate2.get_cuda_device_count() else "cpu"
    except Exception:
        device = "cpu"
compute = args.compute_type or ("float16" if device == "cuda" else "int8")
model = WhisperModel(args.model, device=device, compute_type=compute,
                     download_root=os.environ.get("CICY_MODEL_CACHE"))
segments, info = model.transcribe(str(source), language=args.language,
                                  vad_filter=True, word_timestamps=True)
items = list(segments)

def stamp(seconds):
    millis = int(round(seconds * 1000))
    hours, millis = divmod(millis, 3600000)
    minutes, millis = divmod(millis, 60000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"

text_path = out / "transcript.txt"
srt_path = out / "transcript.srt"
json_path = out / "transcript.json"
text_path.write_text("".join(x.text for x in items).strip() + "\n", encoding="utf-8")
srt_path.write_text("\n\n".join(
    f"{i}\n{stamp(x.start)} --> {stamp(x.end)}\n{x.text.strip()}"
    for i, x in enumerate(items, 1)
) + "\n", encoding="utf-8")
payload = {
    "input": str(source), "model": args.model, "device": device,
    "language": info.language, "language_probability": info.language_probability,
    "duration": info.duration, "segments": [
        {"start": x.start, "end": x.end, "text": x.text.strip()} for x in items
    ],
}
json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"text": str(text_path), "srt": str(srt_path), "json": str(json_path), "language": info.language}, ensure_ascii=False))

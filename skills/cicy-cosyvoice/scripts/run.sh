#!/usr/bin/env bash
set -euo pipefail
ENGINE=${CICY_ENGINE_DIR:?CICY_ENGINE_DIR is required}
JOB=${CICY_JOB_DIR:?CICY_JOB_DIR is required}
OUT="$JOB/voice.wav"
mkdir -p "$(dirname "$OUT")"
"$ENGINE/env/bin/python" "$ENGINE/cosyvoice_tts.py" "$@" --out "$OUT"
[ -s "$OUT" ] || { echo "empty CosyVoice output" >&2; exit 1; }
printf '{"audio":"%s"}\n' "$OUT"

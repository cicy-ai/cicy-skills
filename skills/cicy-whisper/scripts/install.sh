#!/usr/bin/env bash
set -euo pipefail
WORK=${CICY_ENGINE_DIR:?CICY_ENGINE_DIR is required}
CACHE=${CICY_MODEL_CACHE:-$WORK/cache}
mkdir -p "$WORK" "$CACHE"
if [[ ! -x "$WORK/venv/bin/python" ]]; then python3 -m venv "$WORK/venv"; fi
PIP_CACHE_DIR="$CACHE/pip" "$WORK/venv/bin/pip" install --disable-pip-version-check -U pip "faster-whisper==1.1.1"
cp -f "$(dirname "$0")/transcribe.py" "$WORK/transcribe.py"
"$WORK/venv/bin/python" -c 'import faster_whisper; print("faster-whisper import ok")'
printf 'version=faster-whisper-1.1.1\n' > "$WORK/WHISPER_READY"

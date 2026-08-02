#!/usr/bin/env bash
set -euo pipefail
ENGINE=${CICY_ENGINE_DIR:?CICY_ENGINE_DIR is required}
exec "$ENGINE/venv/bin/python" "$ENGINE/transcribe.py" "$@" --out-dir "${CICY_JOB_DIR:?}"

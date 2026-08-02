#!/bin/bash
# HeyGem 对口型合成封装(EXPERIMENTAL):synthesize.sh <video> <audio> <out.mp4>
# 与 musetalk-synthesize.sh 同接口,供 koubo 后端按 engine=heygem 调用。
set -euo pipefail
V=${1:?video}; A=${2:?audio}; OUT=${CICY_JOB_DIR:?CICY_JOB_DIR is required}/video.mp4
WORK=${CICY_ENGINE_DIR:?CICY_ENGINE_DIR is required}
REPO=$WORK/HeyGem-Linux-Python-Hack
PY=$WORK/env/bin/python
export LD_LIBRARY_PATH="/usr/lib64-nvidia:$WORK/env/lib:${LD_LIBRARY_PATH:-}"
export MPLBACKEND=Agg

cd $REPO
JOB=${CICY_JOB_DIR:?CICY_JOB_DIR is required}
INPUT="$JOB/input"
mkdir -p "$INPUT"
cp -f "$V" "$INPUT/in.mp4"
ffmpeg -v error -y -i "$A" -ar 16000 -ac 1 "$INPUT/in.wav"

T0=$(date +%s)
MARKER="$JOB/heygem-start.marker"
touch "$MARKER"
$PY run.py --audio_path "$INPUT/in.wav" --video_path "$INPUT/in.mp4" || { echo "!!! heygem run.py failed"; exit 1; }

# 上游输出目录随版本变化；推理已由 CLI 串行化，只接受本次启动后唯一变更的 mp4。
mapfile -t CREATED < <(find . -type f -name '*.mp4' -newer "$MARKER" -print)
[ "${#CREATED[@]}" -eq 1 ] || { echo "!!! expected exactly one new HeyGem mp4, got ${#CREATED[@]}"; exit 1; }
O=${CREATED[0]}
cp -f "$O" "$OUT"
[ -s "$OUT" ] || { echo "empty HeyGem output" >&2; exit 1; }
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" 2>/dev/null || echo 0)
printf '{"video":"%s","duration":"%s","wall_seconds":%s}\n' "$OUT" "$D" "$(( $(date +%s) - T0 ))"

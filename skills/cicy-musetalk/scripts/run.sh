#!/bin/bash
# MuseTalk 1.5 synthesis wrapper for an isolated CICY_JOB_DIR.
#   bash synthesize.sh <base_video> <audio> <out.mp4> [bbox_shift]
#   bash synthesize.sh            # 无参数 = 官方样例冒烟测试
# 输出: 对完口型的 mp4(带音轨)拷贝到 <out.mp4>,stdout 最后一行 "OK out=... wall=...s"
set -euo pipefail

# Colab 容器的 NVIDIA 驱动库不在默认搜索路径;SSH 会话没有 notebook 的 env,必须显式补上
export LD_LIBRARY_PATH="/usr/lib64-nvidia:${LD_LIBRARY_PATH:-}"
# 强制无头 matplotlib 后端,避免继承 Jupyter 的 inline 后端导致 mmpose 崩
export MPLBACKEND=Agg

WORK=${CICY_ENGINE_DIR:?CICY_ENGINE_DIR is required}
ENV=$WORK/env
REPO=$WORK/MuseTalk
PY=$ENV/bin/python

VIDEO=${1:?video path is required}
AUDIO=${2:?audio path is required}
OUT=${CICY_JOB_DIR:?CICY_JOB_DIR is required}/video.mp4
BBOX=0
shift 2
while [ "$#" -gt 0 ]; do
  case "$1" in
    --bbox) BBOX=${2:?missing --bbox value}; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

[ -f "$VIDEO" ] || { echo "video not found: $VIDEO"; exit 1; }
[ -f "$AUDIO" ] || { echo "audio not found: $AUDIO"; exit 1; }

JOB=${CICY_JOB_DIR:?CICY_JOB_DIR is required}/inference.yaml
cat > $JOB <<EOF
task_0:
 video_path: "$VIDEO"
 audio_path: "$AUDIO"
 bbox_shift: $BBOX
EOF

RESULT_DIR=${CICY_JOB_DIR:?CICY_JOB_DIR is required}/results
mkdir -p "$RESULT_DIR"
cd $REPO
START=$(date +%s)
$PY -m scripts.inference \
  --inference_config $JOB \
  --result_dir $RESULT_DIR \
  --unet_model_path $REPO/models/musetalkV15/unet.pth \
  --unet_config $REPO/models/musetalkV15/musetalk.json \
  --version v15
ELAPSED=$(( $(date +%s) - START ))

RESULT=$(find $RESULT_DIR -name '*.mp4' | head -1)
[ -n "$RESULT" ] || { echo "no output mp4 produced"; exit 1; }
cp "$RESULT" "$OUT"
[ -s "$OUT" ] || { echo "empty MuseTalk output" >&2; exit 1; }
DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUT" 2>/dev/null || echo "?")
printf '{"video":"%s","duration":"%s","wall_seconds":%s}\n' "$OUT" "$DUR" "$ELAPSED"

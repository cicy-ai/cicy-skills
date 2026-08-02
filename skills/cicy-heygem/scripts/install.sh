#!/bin/bash
# Experimental HeyGem provisioner for Colab and Linux GPU workers.
# All runtime paths derive from CICY_ENGINE_DIR; 16 GB or more VRAM is preferred.
set -uo pipefail
export LD_LIBRARY_PATH="/usr/lib64-nvidia:${LD_LIBRARY_PATH:-}"
export MPLBACKEND=Agg

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORK=${CICY_ENGINE_DIR:?CICY_ENGINE_DIR is required}
ENV=$WORK/env
REPO=$WORK/HeyGem-Linux-Python-Hack
REPO_REV=26a11ef830d5969957081dfc30f6f779d0b43fcb
MODEL_CACHE=${CICY_MODEL_CACHE:-$WORK/cache}
export MAMBA_ROOT_PREFIX=$WORK/mamba
export PIP_CACHE_DIR=$MODEL_CACHE/pip
export HF_HOME=$MODEL_CACHE/huggingface
export PIP_DEFAULT_TIMEOUT=120
export PIP_RETRIES=8
export GIT_TERMINAL_PROMPT=0

log(){ echo "=== [$(date +%H:%M:%S)] $*"; }
die(){ echo "!!! $*" >&2; exit 1; }
retry() {
  local attempt=1
  until "$@"; do
    [ "$attempt" -ge 5 ] && return 1
    log "下载失败，${attempt}/5；稍后续传重试"
    sleep $((attempt * 3))
    attempt=$((attempt + 1))
  done
}

rm -f $WORK/HG_READY
mkdir -p $WORK "$PIP_CACHE_DIR" "$HF_HOME"
GPU_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1) || die "no GPU"
log "0/5 GPU ${GPU_MB}MiB"
log "下载加速: 共享缓存 + 断点续传 + 5 次重试 + 4 路并发"
[ "$GPU_MB" -ge 15000 ] || echo "WARN: 显存 <15GB,HeyGem 可能 OOM"

log "1/5 micromamba + python 3.8 (upstream binary extension ABI)"
MM=$WORK/bin/micromamba
if [ ! -x "$MM" ]; then
  mkdir -p $WORK/bin
  ARCHIVE=$WORK/micromamba.tar.bz2
  retry curl -fL https://micro.mamba.pm/api/micromamba/linux-64/2.8.1 -o "$ARCHIVE" || die "micromamba download"
  echo "8528263837623551a44464a372e5bd6b0b856479a83d2a77490a19dd98da3b06  $ARCHIVE" | sha256sum -c - || die "micromamba checksum"
  (cd $WORK && tar -xjf "$ARCHIVE" bin/micromamba) || die "micromamba extract"
fi
if [ -x "$ENV/bin/python" ] && ! "$ENV/bin/python" -c \
  'import sys; raise SystemExit(0 if sys.version_info[:2] == (3, 8) else 1)'; then
  log "检测到不兼容 Python 环境，重建为 3.8"
  rm -rf "$ENV"
fi
[ -x $ENV/bin/python ] || $MM --root-prefix "$MAMBA_ROOT_PREFIX" create -y -q -p $ENV -c conda-forge python=3.8 pip || die "env create"
PIP=$ENV/bin/pip; PY=$ENV/bin/python

log "2/5 HeyGem repo"
[ -d $REPO/.git ] || retry git clone -q --filter=blob:none https://github.com/Holasyb918/HeyGem-Linux-Python-Hack $REPO || die "clone"
retry git -C "$REPO" fetch --depth 1 origin "$REPO_REV" || die "fetch pinned revision"
git -C "$REPO" checkout --detach "$REPO_REV" || die "checkout pinned revision"
# `service/*.cpython-38-*.so` is distributed only for CPython 3.8.
# Keep the upstream guard and fail installation if the ABI is not loadable.
git -C "$REPO" checkout -- run.py
"$PY" -c 'import sys; assert sys.version_info[:2] == (3, 8)'

log "3/5 requirements(torch2.0.1+cu118 + onnxruntime-gpu 1.19/CUDA12)"
cd $REPO
# 上游 requirements 固定了已经下架的 cu113/ORT 1.9 和 Python 3.8
# 时代的包。不要再读取它；这里维护经过 Colab T4 验证的兼容清单。
retry "$PIP" install -q \
  "torch==2.0.1+cu118" "torchvision==0.15.2+cu118" "torchaudio==2.0.2+cu118" \
  --index-url https://download.pytorch.org/whl/cu118 \
  || die "PyTorch cu118 安装失败（已重试 5 次）"
retry "$PIP" install -q \
  "numpy==1.24.4" "onnxruntime-gpu==1.19.2" \
  "opencv-python-headless==4.8.1.78" "scipy==1.10.1" \
  "scikit-image==0.21.0" "scikit-learn==1.3.2" \
  "librosa==0.10.1" "soundfile==0.12.1" \
  "transformers==4.30.2" "tokenizers==0.13.3" \
  "huggingface-hub==0.16.4" "kornia==0.6.12" \
  "pillow==9.5.0" "protobuf==4.23.4" "typeguard==2.13.3" \
  "trimesh==3.23.5" "pyrender==0.1.45" "pyopengl==3.1.0" \
  "cv2box==0.5.9" "apstone==0.0.8" \
  "einops==0.6.1" pyyaml requests tqdm flask psutil numexpr \
  || die "HeyGem 兼容依赖安装失败（已重试 5 次）"

log "4/5 模型权重(download.sh)"
bash "$SCRIPT_DIR/download.sh" 2>&1 | tail -5 || die "model download"
# 多人脸检测兜底模型
if [ ! -f face_detect_utils/resources/.scrfd10g ]; then
  curl -fsSL -o $WORK/scrfd_10g_kps.onnx \
    https://github.com/Holasyb918/HeyGem-Linux-Python-Hack/releases/download/ckpts_and_onnx/scrfd_10g_kps.onnx \
    && cp -f $WORK/scrfd_10g_kps.onnx face_detect_utils/resources/scrfd_500m_bnkps_shape640x640.onnx \
    && touch face_detect_utils/resources/.scrfd10g || echo "WARN: scrfd 替换失败(多人脸场景可能报错)"
fi

log "5/5 onnx/cuda 自检 + 合成封装"
CHECK_OUT=$("$PY" check_env/check_onnx_cuda.py 2>&1) \
  || { echo "$CHECK_OUT"; die "ONNX CUDA 自检进程失败"; }
echo "$CHECK_OUT"
echo "$CHECK_OUT" | grep -q "NOT using the GPU" \
  && die "ONNX CUDA 实际 Session 回退到 CPU"
echo "$CHECK_OUT" | grep -q "CUDAExecutionProvider" \
  || die "ONNX CUDA 实际 Session 未启用 CUDAExecutionProvider"
# READY 之前必须走到 HeyGem 的顶层业务模块；仅验证 ONNX 不足以发现
# DINet 等运行时依赖缺失。
(cd "$REPO" && "$PY" -c 'import service.trans_dh_service') \
  || die "HeyGem 业务模块导入自检失败"
cp -f "$SCRIPT_DIR/run.sh" "$WORK/synthesize.sh" && chmod +x "$WORK/synthesize.sh" || die "synthesize wrapper"

cat > $WORK/HG_READY <<EOF
provisioned_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
gpu_mb=$GPU_MB
python=3.8 onnxruntime-gpu=1.19.2
note=experimental
EOF
log "DONE — HG_READY written"

#!/bin/bash
# MuseTalk 1.5 provisioner for Colab and Linux GPU workers.
# All runtime paths derive from CICY_ENGINE_DIR; re-runs repair partial installs.
# Full sample-video inference belongs to E2E tests, not every new VM install.
set -uo pipefail

# Colab 容器的 NVIDIA 驱动库不在默认搜索路径;SSH 会话没有 notebook 的 env,必须显式补上
export LD_LIBRARY_PATH="/usr/lib64-nvidia:${LD_LIBRARY_PATH:-}"
# 从笔记本 cell 启动会继承 Jupyter 的 MPLBACKEND=inline,mmpose 导入 matplotlib 会崩;强制无头后端
export MPLBACKEND=Agg

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WORK=${CICY_ENGINE_DIR:?CICY_ENGINE_DIR is required}
ENV=$WORK/env
REPO=$WORK/MuseTalk
REPO_REV=0a89dec45a0192b824e3cf4daf96c239440c5ed8
MODEL_CACHE=${CICY_MODEL_CACHE:-$WORK/cache}
export MAMBA_ROOT_PREFIX=$WORK/mamba
export PIP_CACHE_DIR=$MODEL_CACHE/pip
export HF_HOME=$MODEL_CACHE/huggingface
export HUGGINGFACE_HUB_CACHE=$HF_HOME/hub
export HF_HUB_DOWNLOAD_TIMEOUT=120
export HF_HUB_ETAG_TIMEOUT=15
# hf_transfer uses a small global permit pool. Multiple concurrent repository
# downloads can exhaust it with "no permits available" on Colab. The standard
# downloader is resumable and more reliable; disable Xet signed-CAS as well.
export HF_HUB_ENABLE_HF_TRANSFER=0
export HF_HUB_DISABLE_XET=1
export PIP_DEFAULT_TIMEOUT=120
export PIP_RETRIES=8
export GIT_TERMINAL_PROMPT=0

log() { echo "=== [$(date +%H:%M:%S)] $*"; }
die() { echo "!!! $*" >&2; exit 1; }
retry() {
  local attempt=1
  until "$@"; do
    [ "$attempt" -ge 5 ] && return 1
    log "下载失败，${attempt}/5；稍后续传重试"
    sleep $((attempt * 3))
    attempt=$((attempt + 1))
  done
}

rm -f $WORK/READY
mkdir -p "$PIP_CACHE_DIR" "$HUGGINGFACE_HUB_CACHE"
if [ "${CICY_DOCKER_BUILD:-0}" = "1" ]; then
  GPU="docker-build (GPU validation deferred)"
else
  GPU=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader) || die "no GPU on this runtime"
fi
log "GPU: $GPU"
log "下载加速: 共享缓存 + 标准断点续传 + 5 次重试 + 最多 3 路模型并发"

log "1/7 micromamba + python 3.10 env"
mkdir -p $WORK
if [ ! -x $WORK/bin/micromamba ]; then
  ARCHIVE=$WORK/micromamba.tar.bz2
  retry curl -fL https://micro.mamba.pm/api/micromamba/linux-64/2.8.1 -o "$ARCHIVE" || die "micromamba download"
  echo "8528263837623551a44464a372e5bd6b0b856479a83d2a77490a19dd98da3b06  $ARCHIVE" | sha256sum -c - || die "micromamba checksum"
  (cd $WORK && tar -xjf "$ARCHIVE" bin/micromamba) || die "micromamba extract"
fi
if [ ! -x $ENV/bin/python ]; then
  $WORK/bin/micromamba --root-prefix "$MAMBA_ROOT_PREFIX" create -y -q -p $ENV -c conda-forge python=3.10 pip || die "env create failed"
fi
PIP="$ENV/bin/pip"
PY="$ENV/bin/python"

log "2/7 torch 2.0.1 + cu118"
$PY -c 'import torch; assert torch.__version__.startswith("2.0.1")' 2>/dev/null || \
  $PIP install -q torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 \
    --index-url https://download.pytorch.org/whl/cu118 || die "torch install failed"

log "3/7 MuseTalk repo + requirements"
[ -d $REPO/.git ] || retry git clone --filter=blob:none https://github.com/TMElyralab/MuseTalk $REPO || die "clone failed"
retry git -C "$REPO" fetch --depth 1 origin "$REPO_REV" || die "fetch pinned revision"
git -C "$REPO" checkout --detach "$REPO_REV" || die "checkout pinned revision"
$PIP install -q -r $REPO/requirements.txt || die "requirements failed"
$PIP install -q -U openmim || die "openmim failed"

log "4/7 mmlab stack (mmcv 2.0.1 / mmdet 3.1.0 / mmpose 1.1.0)"
# chumpy(mmpose 传递依赖)的 setup.py 在新 pip 的隔离构建下崩;用环境内 numpy 免隔离预装
$PY -c 'import chumpy' 2>/dev/null || {
  $PIP install -q "setuptools<70" wheel cython
  $PIP install -q --no-build-isolation chumpy==0.70 || die "chumpy failed"
}
$PY -c 'import mmpose' 2>/dev/null || \
  $ENV/bin/mim install -q mmengine "mmcv==2.0.1" "mmdet==3.1.0" "mmpose==1.1.0" || die "mmlab failed"

log "5/7 model weights (direct HuggingFace)"
# hub 必须锁 0.30.2:1.x 移除了 huggingface-cli,且 transformers 4.39 要求 hub<1.0
$PIP install -q "huggingface_hub[cli]==0.30.2" gdown
M=$REPO/models
mkdir -p $M/musetalkV15 $M/syncnet $M/dwpose $M/face-parse-bisent $M/sd-vae $M/whisper
HF=$ENV/bin/huggingface-cli
(
  [ -f $M/musetalkV15/unet.pth ] || retry $HF download TMElyralab/MuseTalk --revision 3ef28bc5cff08c90ad8178a25f1b570cd800170f --local-dir $M \
    --include "musetalkV15/musetalk.json" "musetalkV15/unet.pth"
) & P1=$!
(
  [ -f $M/sd-vae/diffusion_pytorch_model.safetensors ] || {
    retry $HF download stabilityai/sd-vae-ft-mse --revision 31f26fdeee1355a5c34592e401dd41e45d25a493 --local-dir $M/sd-vae \
      --include "config.json" "diffusion_pytorch_model.safetensors" || true
    if [ ! -f $M/sd-vae/diffusion_pytorch_model.safetensors ]; then
      retry $HF download stabilityai/sd-vae-ft-mse --revision 31f26fdeee1355a5c34592e401dd41e45d25a493 --local-dir $M/sd-vae \
        --include "config.json" "diffusion_pytorch_model.bin"
      SD_VAE_DIR=$M/sd-vae $PY - <<'PY'
import os
from pathlib import Path

import torch
from safetensors.torch import save_file

root = Path(os.environ["SD_VAE_DIR"])
source = root / "diffusion_pytorch_model.bin"
target = root / "diffusion_pytorch_model.safetensors"
state = torch.load(source, map_location="cpu")
if isinstance(state, dict) and isinstance(state.get("state_dict"), dict):
    state = state["state_dict"]
if not isinstance(state, dict):
    raise RuntimeError("unexpected SD-VAE checkpoint format")
tensors = {
    str(key): value.detach().contiguous()
    for key, value in state.items()
    if isinstance(value, torch.Tensor)
}
if not tensors:
    raise RuntimeError("SD-VAE checkpoint contains no tensors")
save_file(tensors, target, metadata={"format": "pt"})
print(f"converted {source.name} -> {target.name}")
PY
    fi
    [ -s $M/sd-vae/diffusion_pytorch_model.safetensors ]
  }
) & P2=$!
(
  [ -f $M/whisper/pytorch_model.bin ] || retry $HF download openai/whisper-tiny --revision 169d4a4341b33bc18d8881c4b69c2e104e1cc0af --local-dir $M/whisper \
    --include "config.json" "pytorch_model.bin" "preprocessor_config.json"
) & P3=$!
DOWNLOAD_FAILED=0
for PID in "$P1" "$P2" "$P3"; do
  wait "$PID" || DOWNLOAD_FAILED=1
done
[ "$DOWNLOAD_FAILED" -eq 0 ] || die "HuggingFace model download failed (batch 1/2)"

(
  [ -f $M/dwpose/dw-ll_ucoco_384.pth ] || retry $HF download yzd-v/DWPose --revision 1a7144101628d69ee7a3768d1ee3a094070dc388 --local-dir $M/dwpose \
    --include "dw-ll_ucoco_384.pth"
) & P4=$!
(
  [ -f $M/syncnet/latentsync_syncnet.pt ] || retry $HF download ByteDance/LatentSync --revision 405eda8eab9f65c1a6e0c292a5dee5a08089e2ae --local-dir $M/syncnet \
    --include "latentsync_syncnet.pt"
) & P5=$!
DOWNLOAD_FAILED=0
for PID in "$P4" "$P5"; do
  wait "$PID" || DOWNLOAD_FAILED=1
done
[ "$DOWNLOAD_FAILED" -eq 0 ] || die "HuggingFace model download failed (batch 2/2)"
[ -f $M/face-parse-bisent/79999_iter.pth ] || $ENV/bin/gdown 154JgKpzCPW82qINcVieuPH3fZ2e0P812 \
  -O $M/face-parse-bisent/79999_iter.pth || die "face-parse failed"
[ -f $M/face-parse-bisent/resnet18-5c106cde.pth ] || curl -sL https://download.pytorch.org/models/resnet18-5c106cde.pth \
  -o $M/face-parse-bisent/resnet18-5c106cde.pth || die "resnet18 failed"

log "6/7 ffmpeg + synthesize wrapper (latest from repo)"
command -v ffmpeg >/dev/null || die "ffmpeg is required"
cp -f "$SCRIPT_DIR/run.sh" "$WORK/synthesize.sh" || die "synthesize.sh install failed"
chmod +x $WORK/synthesize.sh
$PY -c "import torch, mmpose, diffusers; print('torch', torch.__version__, 'cuda_ok', torch.cuda.is_available())" \
  || die "sanity import failed"

log "7/7 fast readiness check (no test video)"
for REQUIRED in \
  "$M/musetalkV15/unet.pth" \
  "$M/musetalkV15/musetalk.json" \
  "$M/sd-vae/diffusion_pytorch_model.safetensors" \
  "$M/whisper/pytorch_model.bin" \
  "$M/dwpose/dw-ll_ucoco_384.pth"; do
  [ -s "$REQUIRED" ] || die "required model missing: $REQUIRED"
done
$PY - <<'PY' || die "CUDA/core import readiness check failed"
import torch
import diffusers
import mmpose

if not torch.cuda.is_available():
    raise RuntimeError("CUDA unavailable")
torch.zeros(1, device="cuda")
print("fast readiness check passed")
PY

{
  echo "gpu=$GPU"
  echo "provisioned_at=$(date -u +%FT%TZ)"
  echo "readiness_check=fast"
  $PY -c "import torch; print('torch='+torch.__version__)"
} > $WORK/READY
log "DONE — READY written (fast check; full video test skipped)"

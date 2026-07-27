# ocr — 文件布局 / 环境变量 / 依赖

## 文件布局

| 路径 | 说明 |
|---|---|
| `bin/ocr` | 命令行界面（基于 Node.js，零 npm 依赖） |
| `bin/ocr_run.py` | 唯一的 Python 文件：输入图像路径 → 输出 JSON 边界框，每次调用仅加载一次引擎 |
| `~/.cache/ocr-skill/venv/` | 专用虚拟环境，包含 `rapidocr_onnxruntime`（由 `ocr install` 创建） |

无配置文件，无密钥。ONNX 模型内置于 pip 包中 ——
安装后完全离线可用。

## 环境变量

| 变量 | 默认值 | 含义 |
|---|---|---|
| `OCR_PYTHON` | （自动） | 解释器覆盖，若设置则替代 `PATH` 中的 `python3` 进行检查 |
| `OCR_VENV_DIR` | `~/.cache/ocr-skill/venv` | `ocr install` 存放虚拟环境的目录 |
| `OCR_PIP_INDEX` | （未设置） | 额外的 pip 索引 URL，在 PyPI 和 tuna 镜像之前尝试 |

## 外部程序

| 程序 | 用途 | 备注 |
|---|---|---|
| `python3` | 所有功能 | 版本 3.8+；Debian 系统安装时还需 `python3-venv` |
| `pip` (在虚拟环境中) | 仅用于安装 | 内置镜像回退机制 |

## 标准输出 / 标准错误约定

- **标准输出 (stdout)**：仅包含识别后的文本或 `--json` 文档。适合管道传输。
- **标准错误 (stderr)**：安装进度、单个文件处理错误、用法错误。

## 设计说明

纯命令行设计 —— 无常驻伴生进程。引擎加载约需 2 秒，可通过批处理调用（`ocr *.png`）摊销该开销。若调用方需要亚秒级重复 OCR（例如，监视器循环），则可采用 wechat-scrm 的常驻伴生进程模式：保持一个进程存活，并将 PNG 字节 POST 发送给它。

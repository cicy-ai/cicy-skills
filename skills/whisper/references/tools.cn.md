# whisper — 布局 / 环境 / 依赖

## 文件布局

| 路径 | 说明 |
|---|---|
| `~/.local/bin/whisper-cli` | whisper.cpp 二进制文件（由 `whisper install` 创建的符号链接） |
| `~/.cache/whisper-cpp/ggml-<model>.bin` | 已下载的模型 |
| `~/.cache/whisper-cpp/ggml-<model>.bin.partial` | 下载中断的文件——可通过 `whisper pull` 自动恢复 |

无配置文件，无机密信息——模型下载后，该技能可完全离线运行。

## 环境变量

| 变量名 | 默认值 | 说明 |
|---|---|---|
| `WHISPER_MODEL` | `base` | 转录/安装时使用的默认模型 |
| `WHISPER_MODEL_DIR` | `~/.cache/whisper-cpp` | 模型存储目录 |
| `WHISPER_HF_BASE` | （未设置） | 额外的模型镜像基础 URL，会在内置镜像之前尝试 |
| `WHISPER_GIT_REPO` | （未设置） | Linux 源码编译所用的 whisper.cpp Git 镜像 |

## 外部程序

| 程序名 | 用途 | 备注 |
|---|---|---|
| `whisper-cli` | 转录 | whisper.cpp；通过 `whisper install` 安装 |
| `curl` | 下载模型 | 使用 `-C -` 恢复下载 |
| `brew` | 安装路径（macOS/linuxbrew） | 存在时优先使用 |
| `git` + `cmake` + C++ 工具链 | 安装路径（Linux） | 在 brew 不存在时自动进行静态源码编译 |
| `ffmpeg` | 处理非原生格式输入 | 仅用于 wav/mp3/flac/ogg 以外的格式 |

## 标准输出/标准错误约定

- **stdout**：转录文本（或命令输出）。可安全重定向/管道传输。
- **stderr**：进度信息、下载进度条、`✓ file.srt` 提示、错误信息。

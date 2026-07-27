# whisper — 命令参考

## transcribe

```
whisper transcribe <文件…> [选项]
whisper <文件> [选项]          # 快捷方式：第一个参数若为已存在文件则直接使用
```

将纯文本转录结果输出到**标准输出**（进度信息/错误信息会输出到错误输出，因此 `whisper a.mp3 > a.txt` 是安全的）。使用格式参数时也会生成文件。

| 选项 | 说明 |
|---|---|
| `-m, --model <名称>` | 使用的模型（默认 `base`，或使用 `$WHISPER_MODEL`）；若缺失则自动下载 |
| `-l, --lang <代码>` | 口语语言（`zh`、`en` 等；默认 `auto`） |
| `--srt` `--vtt` `--json` `--txt` `--csv` `--lrc` | 在输入文件旁生成对应格式文件（可组合使用） |
| `-o, --output <路径>` | 格式文件的输出路径（仅单输入时有效；文件扩展名自动推导） |
| `--timestamps` | 在标准输出中保留 `[00:00:00.000 --> …]` 格式的时间戳行 |
| `--translate` | 将结果翻译为英文 |
| `--prompt <文本>` | 初始提示语——预置专有名词/术语以提升准确率 |
| `-t, --threads <数量>` | CPU 线程数 |

多个文件将按相同选项顺序处理。

## install

```
whisper install [--model base] [--no-model]
```

1. 查找 `whisper-cli`（若已在 `~/.local/bin` 中则完成；若在 PATH 其他位置则创建符号链接到 `~/.local/bin`；若未找到则执行 `brew install whisper-cpp` 后创建符号链接；若无 brew 则**自动从源码构建**——浅克隆 whisper.cpp（优先 github，备用 gitee，可通过 `WHISPER_GIT_REPO` 自定义仓库），执行静态 `cmake` 构建，将二进制文件复制到 `~/.local/bin`。需要 `git cmake build-essential`；错误信息中会提示缺失的工具）。
2. 确保下载默认模型（使用 `--no-model` 可跳过）。
3. 输出 `whisper status` 信息。

具有幂等性——可重复执行。

## models / pull / rm

```
whisper models          # 显示模型目录（含大小与安装状态）
whisper pull small      # 下载模型；支持断点续传（.partial 文件）
whisper rm small        # 删除模型（及其 .partial 文件）
```

已知模型：`tiny tiny.en base base.en small small.en medium medium.en large-v2 large-v3 large-v3-turbo`。下载源按顺序尝试：
`$WHISPER_HF_BASE`（如已设置）→ `hf-mirror.com` → `huggingface.co`。

## status

```
whisper status
```

显示解析后的 `whisper-cli` 路径与版本、ffmpeg 是否存在、模型目录、已安装模型，以及所有未完成的 `.partial` 下载文件。

## 退出码

- `0` 成功
- `1` 运行时错误（下载失败、whisper-cli/ffmpeg 错误、未安装）
- `2` 用法错误（未知命令/选项/模型、文件缺失）

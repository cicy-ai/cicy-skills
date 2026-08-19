# agent-summary 帮助

转储智能体的原始对话：完整保留 `text` + `thinking`，以及每次工具调用的紧凑追踪（仅名称 + 关键参数，结果截断为开头；错误时保留更多内容），并剥离系统提示词与 `<system-reminder>` 模板。每个文件以东八区时间戳 `Date: YYYY-MM-DD HH:mm:ss +08:00` 开头。将对话保存至 `<history>/summary/<conversation_id>.md`，并将 `current.md` 符号链接重指向该文件，最后打印该文件路径。可将其交给“分身”或通过重放来恢复对话。

```
agent-summary <agent-id>                 # 写入文件并打印路径
agent-summary <path/to/current.json>     # 显式指定快照文件
```

源数据（硬编码）仅来自：`~/cicy-ai/workers/<agent-id>/.cicy/history/{current.json,reply.json}`——不读取原生智能体日志（jsonl / codex / opencode db / kiro）。仅覆盖智能体当前上下文窗口——压缩前的历史记录仅作为紧凑摘要消息得以保留。

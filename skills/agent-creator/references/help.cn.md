# agent-creator — 命令参考

```
agent-creator list [--json]                 列出自定义智能体
agent-creator tools [--json]                列出可选工具组
agent-creator show <名称> [--json]          显示一个智能体的角色/工具/模型
agent-creator create <名称> [选项]          创建或覆盖自定义智能体
agent-creator delete <名称> [--json]        删除自定义智能体
agent-creator --help                        显示帮助
```

别名：`ls`=list, `new`/`add`=create, `get`=show, `rm`/`del`=delete。

## 创建选项

| 标志 | 含义 |
|------|------|
| `--tools a,b` | 逗号分隔的工具组（运行 `agent-creator tools` 查看可用工具集） |
| `--model <id>` | 新实例的默认模型（例如 `claude-opus-4-8`）；留空则使用宿主默认值 |
| `--prompt "..."` | 内联角色文本 |
| `--prompt-file <路径>` | 从文件读取角色文本 |
| (标准输入) | 若未指定 `--prompt`/`--prompt-file`，管道输入的标准输入将用作角色描述 |
| `--json` | 机器可读输出 |

`<名称>` 可以是任意字符串（支持中文）；服务器会将其转换为文件系统兼容的 slug。使用相同名称重新创建会覆盖该智能体。

## 示例

```sh
# 查看工具组
agent-creator tools

# 从内联角色创建
agent-creator create 销售助手 \
  --tools coordinate,shell \
  --model claude-opus-4-8 \
  --prompt "你是销售助手,主动热情,擅长挖掘需求。"

# 从文件或管道创建
agent-creator create 客服小美 --tools coordinate --prompt-file persona.md
cat persona.md | agent-creator create 客服小美 --tools coordinate

# 查看/列表/删除
agent-creator list
agent-creator show 销售助手 --json
agent-creator delete 销售助手
```

## 使用自定义智能体

创建完成后，打开 cicy-code 的 **新建员工 / new worker** 选择器。该智能体将以 `★ <名称>` 的形式显示，智能体类型为 `custom:<slug>`。选择它将创建一个应用了该角色、工具和默认模型的实例（服务器会将 `custom:<slug>` 映射为具有相应角色的 `cicy` 智能体）。

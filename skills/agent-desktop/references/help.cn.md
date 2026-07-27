# agent-desktop — 帮助说明

## 命令列表

```
agent-desktop clients [--json]
agent-desktop ping [--client ID] [--json]
agent-desktop exec <shell_cmd> [--client ID] [--json]
agent-desktop exec-file <local_script> [--cwd DIR] [--client ID] [--json]
agent-desktop sysinfo [--client ID] [--json]
agent-desktop rpc <tool> [json_args] [--client ID] [--json]
agent-desktop --help / -h / help
agent-desktop tools [--schema] [--names] [--tag <Tag>] [--static] [--client ID] [--json]
```

`exec-file` 读取**本地**脚本，将其内容上传至桌面端并执行（桌面端保存为临时文件）。执行器根据扩展名选择：`.py` → `exec_python_file`，`.js`/`.mjs`/`.cjs` → `exec_node_file`，其他扩展名 → `exec_shell_file`（bash；Windows 下为 `.bat`）。

`sysinfo` 返回平台架构、**操作系统版本**、主机名、运行时间、CPU信息（型号/核心数/使用率）、内存、负载均值、**磁盘信息**（总容量/已用/可用/使用率）及网络IP地址。由于桌面端的 `get_system_info` 在所有平台都缺少操作系统版本信息，且在非Linux系统缺少磁盘信息，因此 `sysinfo` 通过额外的 `exec_shell` 命令（`sw_vers`/`os-release` + `df -h /`）来补充这些数据——采用尽力而为的方式，在已部署的客户端上均可工作。

`tools` 通过 `list_tools` 元工具**实时**查询已连接的 cicy-desktop（返回工具名称/描述/标签；`--schema` 会附加每个工具的输入模式，`--names` 仅返回名称，`--tag` 按标签过滤）。若未连接客户端或客户端版本早于 `list_tools` 功能，则回退至内置静态文档 `references/tools.md`——也可通过 `--static` 强制使用静态文档。

## 选项说明

- `--client <client_id>` — 指定目标 cicy-desktop 客户端。未指定时，将自动选择用户代理（UA）包含 `ElectronMCP` 的唯一客户端。

## 环境变量

- `CICY_API_TOKEN`        — 令牌覆盖配置
- `CICY_API_PORT`         — 服务器端口（默认 8008）
- `CICY_PANE_ID`          — 默认代理面板标识
- `CICY_GLOBAL_JSON`      — 全局配置文件路径覆盖
- `CICY_AGENT_TIMEOUT_MS` — RPC超时时间（默认 30000 毫秒）

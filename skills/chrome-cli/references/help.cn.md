# chrome-cli — 帮助

仅用于本机 macOS/Linux Chrome。远程管理连接到 cicy-desktop 的 Chrome
请使用 `agent-chrome`，它通过 Electron RPC 工作。

`accountIdx` = profile ID = `profile_N` 中的 `N`。

```text
chrome-cli list [--all] [--json]                 profiles 的别名
chrome-cli profiles [--all] [--json]             列出本机 Profile
chrome-cli profile <N|chrome-N> [--json]          查看配置和运行状态
chrome-cli add [--id N] [--gmail E] [--note T] [--launch] [--json]
chrome-cli proxy <N|chrome-N> <url|"">             设置/清除下次启动使用的代理
chrome-cli launch <N|chrome-N> [--url URL] [--json]
chrome-cli close <N|chrome-N> [--json]
chrome-cli targets --idx <N|chrome-N> [--json]
chrome-cli cdp <method> [json_params] --idx <N|chrome-N> [--target targetId] [--json]
chrome-cli tools
chrome-cli --help
```

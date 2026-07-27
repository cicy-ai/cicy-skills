# claude-design — 帮助

通过 `agent-chrome` CDP 从命令行驱动 **claude.ai/design**。

## 概述

```
claude-design <命令> [参数...] [全局标志]
```

## 命令

### `open [--url <u>]`

启动 Chrome 配置文件（通过 `agent-chrome launch`）并导航至
`https://claude.ai/design`（或使用 `--url` 指定的地址）。如果该配置文件
已在运行，则仍会在活动标签页上设置该 URL。

### `new`

执行 `Page.navigate` 导航至 `https://claude.ai/design`（项目列表）。当您想
离开当前项目时使用此命令。**着陆页没有聊天编辑器** — 要开始发送提示词，请
接下来运行 `create`。

### `create [name] [--mode wireframe|high-fidelity] [--template prototype|slide-deck|from-template|other]`

从 `/design` 着陆页进入一个新项目：

1.  选择模板标签页（默认 `prototype`）
2.  选择保真度模式（默认 `high-fidelity`；别名 `hifi`）
3.  如果提供了 `name`，则填写"项目名称"输入框
4.  点击 `[data-testid="create-project-button"]` 按钮
5.  最多等待 60 秒，直至 URL 变为 `/design/p/<uuid>`
6.  将新项目 URL 以 JSON 格式返回

别名：`--mode hifi` = `high-fidelity`。

```sh
claude-design create "CiCy AI Landing" --mode hifi --template prototype
# → {"ok":true,"action":"create",...,"url":"https://claude.ai/design/p/..."}
```

### `prompt <text|-> [--file <path>] [--wait] [--timeout <ms>]`

向编辑器注入文本并点击发送。

文本来源（按顺序）：
1.  `--file <path>` — 从文件读取
2.  位置参数 `-`（或无位置参数） — 从标准输入读取
3.  位置参数文字 — 用空格连接

`--wait` 会轮询发送按钮：首先等待其变为禁用状态（= 发送中），
然后等待其重新变为启用状态（= 助手完成）。默认超时
600 000 毫秒（10 分钟）— 可用 `--timeout <ms>` 覆盖。

文本通过 base64 + `TextDecoder('utf-8')` 往返传输，因此任何 UTF-8 内容都是安全的（中文、日文、表情符号）。

### `download [--type editable|standalone|zip] [--out <dir>] [--timeout <ms>]`

点击"共享"，然后点击与 `--type` 匹配的导出菜单项：

| `--type`     | 寻找的菜单项                                | 典型大小 |
|--------------|---------------------------------------------|----------|
| `editable`   | "editable" / "可编辑"                       | ~150 KB  |
| `standalone` | "standalone" / "独立" (字体已内联)          | ~14 MB   |
| `zip`        | "Download project as .zip"                  | ~10 MB   |

可选地调用 `Page.setDownloadBehavior` 来设置下载目录（仅在 `--out` 为绝对路径时；相对路径如 `~/Downloads` 则交由浏览器默认设置）。

此技能不会将文件拉取回您的 worker — 它仅在主机上触发下载。关于分块 base64 的处理方法，请参阅 `references/pull.md`。

### `exec <js>`

通过 `Runtime.evaluate` 在页面中运行任意 JavaScript 表达式，
并将其值作为 JSON 返回。适用于一次性的快速探查。

```sh
claude-design exec 'location.href' --idx 6
claude-design exec 'document.querySelectorAll("button").length' --idx 6
```

### `status [--json]`

报告 Chrome 配置文件是否正在运行、当前 URL 以及设计编辑器是否已挂载。

## 全局标志

| 标志             | 环境变量                  | 是否必需 | 含义                                    |
|------------------|---------------------------|----------|-----------------------------------------|
| `--idx <n>`      | `CLAUDE_DESIGN_IDX`       | 是       | Chrome 配置文件账户索引                 |
| `--client <id>`  | `CLAUDE_DESIGN_CLIENT`    | 否       | agent-chrome 远程客户端（省略则为本地） |

## 退出码

| 代码 | 含义                                                        |
|------|-------------------------------------------------------------|
| 0    | 成功                                                        |
| 1    | 运行时错误（CDP 错误、页面 JS 抛出异常、菜单缺失）          |
| 2    | 用法错误（缺少标志、未知子命令）                            |
| 3    | 缺少依赖项（`agent-chrome` 不在 PATH 中）                   |

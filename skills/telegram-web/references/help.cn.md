# telegram-web — 命令参考

语法：`telegram-web [共用选项] <命令> [命令选项]`

共用选项：`--client ID` 选择 agent 客户端；`--target winId|wc:id` 选择目标；`--win N` 是数字窗口别名；`--backend a|k` 覆盖自动判断；`--json` 输出紧凑 JSON；`--apply` 授权修改操作。

命令：

- `login [--from-profile N] [--to-account N] [--proxy URL|--no-proxy] [--url URL] [--from-client ID] --apply`：把 Chrome Telegram localStorage 临时复制到新建或复用的 Electron profile 并安装 hook。默认来源 profile `0`、目标账户 `99`、不使用代理、URL `https://web.telegram.org/a/`；需要代理时必须显式传入 `--proxy URL`，`--from-client` 是保留元数据。
- `open-url [URL] [--profile N] --apply`：在指定 Electron profile 中打开 Telegram Web；默认 URL 为 `https://web.telegram.org/k/`、profile 为 `1`。若相同网址已打开，则恢复、显示并激活原窗口，不重复创建。
- `status`：报告 hook/会话就绪状态。
- `patch`：安装或刷新自动识别的后端 hook。
- `account`：返回标准化的当前账户。
- `chats`：列出标准化聊天。
- `dialogs [--folder active|archived] [--limit N]`：列出有序对话；默认 `active`、`50` 条。
- `users`：列出标准化用户。
- `messages <chatId> [--limit N]`：列出消息；默认 `30` 条。
- `open <chatId> --apply`：打开 Web A 聊天；Web K 返回 `UNSUPPORTED_BACKEND_ACTION`。
- `send <chatId> <text...> --apply`：发送 Web A 文本；Web K 返回 `UNSUPPORTED_BACKEND_ACTION`。
- `eval <expression> [--apply]`：默认只对冻结的只读快照求值；可能修改状态的表达式必须加 `--apply`。
- `close --apply`：只关闭选定目标，并且只清除与其匹配的已保存会话。

成功 JSON：`{"ok":true,"data":...}`。错误 JSON：`{"ok":false,"error":{"code":"...","message":"..."}}`。用法错误退出码为 `2`，目标/认证错误通常为 `4`，传输/运行时错误通常为 `5`。

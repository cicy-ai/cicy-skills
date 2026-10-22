# tg-web-pull — 帮助

```
tg-web-pull webviews [--json]                 列出 Telegram Web K 的 webview（目标）
tg-web-pull groups <target> [--json]          列出某个 webview 里的群组/会话
tg-web-pull pull <target> [选项]              拉取某个群组的消息
tg-web-pull --help
```

`<target>` 是 webContents id：`wc:42` 或直接写 `42`。
用 `--client <id>` 指定某台 cicy-desktop 主机（默认选唯一一台）。

## pull 选项

```
--peer <id>      按 peerId 选群（见 `tg-web-pull groups`，如 -1770576689）
--chat <标题>    按标题部分匹配选群（忽略大小写）
--open           尽力先打开该群（矩阵格子上常被面板覆盖）
--scroll <n>     向上滚动 n 次加载更早的历史（每次约 1.5 秒）
--limit <n>      只返回最近 n 条
--json           机器可读输出
```

不带 `--peer`/`--chat` 时，`pull` 读取当前打开的会话。

## 输出（人类可读）

```
# <群标题> (peer <id>)  <返回数>/<总数> msgs
<YYYY-MM-DD HH:MM>  <mid>  <发送者|→me>
  [media] <正文>
```

## 退出码

```
0  成功
1  运行错误（如目标群未打开——提示会列出当前已打开的会话）
3  缺少 agent-electron / 没有 cicy-code token
```

## 重要：切群是尽力而为

矩阵格子的当前会话由 Telegram 矩阵面板掌控，程序切群（`--open`、hash、点击、CDP
输入）常被面板重新覆盖。所以 `pull` 读取的是**当前打开**的会话，或任何已加载且
`peerId` 匹配 `--peer` 的容器；目标群未打开时会明确报错并列出已打开的会话，等面板
轮换到该群再重试，或先在面板里手动打开该群。

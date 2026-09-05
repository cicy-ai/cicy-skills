# tg-matrix — 命令参考(中文)

```
tg-matrix ls                 列出当前连到控制通道的机器
tg-matrix open <target>      打开或聚焦 Telegram 矩阵面板;不存在则新建
tg-matrix status <target>    查询面板是否已打开 / 是否在前台
```

`<target>`:机器名(如 `xs-1001`)、逗号分隔的列表,或 `all`。
任意命令加 `--json` 输出机器可读格式。

## open
幂等。面板标签已存在则切到前台;不存在则在 profile 0 的标签窗口新建一个
`cicyui://panel/<运行时id>?preset=telegram-matrix` 标签再聚焦。逐台打印:面板是
`created`(新建)还是 `focused`(聚焦)、运行时发现的 `wcid`、当前是否为前台标签。

## status
只读。逐台打印 `panel OPEN` / `panel CLOSED`,以及是否前台、发现的 webContentsId、
标签总数。

## 退出码
`0` 成功 · `2` 用法错误 · `4` 传输或主进程错误(任一机器返回错误对象时也是 4)。

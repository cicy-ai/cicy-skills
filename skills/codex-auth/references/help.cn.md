# codex-auth — 命令说明

## 命令

```
codex-auth export [--out <文件>] [-o <文件>]
codex-auth export --stdout
codex-auth import (--file <文件> | -f <文件> | --base64 <值> | -b <值> | -)
codex-auth status [--json]
codex-auth path
codex-auth help
```

## export(导出)

读取 `~/.codex/auth.json`,先校验它能解析成 JSON 对象,再 base64 编码写入文件,文件以 0600 创建。

- `--out <文件>` — 目标路径,默认 `~/cicy-ai/assets/codex-auth-<时间戳>.b64`
- `--stdout` — 直接打印到标准输出。**只在你确实需要凭据出现在终端输出里时才用**

凭据文件不存在时退出码 2。

## import(还原)

把 base64 解码后写回 `~/.codex/auth.json`。

- `--file <文件>` — 从文件读 base64
- `--base64 <值>` — 直接给值
- `-` — 从标准输入读

输入里的空白会被忽略。写入前有两道校验:必须是合法 base64(会做一次回环比对,
截断的粘贴会被拒绝),解码结果必须是 JSON 对象。已存在的凭据会先复制到
`~/.codex/auth.json.bak-<时间戳>`,并保留原文件权限位。

**已经在运行的 Codex 进程仍用旧凭据**,之后启动的才会用新的。

## status(状态)

打印路径、字节数、八进制权限、修改时间,以及是否能解析为 JSON。**不打印内容**。
`--json` 输出机器可读格式。文件不存在时退出码 2。

## path

打印解析后的凭据路径。

## 环境变量

`CODEX_AUTH_PATH` — 绝对路径,覆盖默认的 `~/.codex/auth.json`,用于测试或非标准布局。

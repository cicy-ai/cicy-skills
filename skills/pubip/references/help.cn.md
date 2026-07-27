# pubip — 帮助信息

## 用法

```
pubip          # 打印IP地址，例如 117.136.71.183
pubip --json   # {"ok":true,"data":{"ip":"117.136.71.183"}}
pubip --help   # 显示此帮助文本
```

## 行为特性

- 从 curl 环境变量中清除 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`、`NO_PROXY`
  （包括其小写变体）
- 添加 `curl --noproxy '*'` 以绕过任何编译内置的默认设置
- 10秒超时 (`-m 10`)
- 端点地址：`https://ifconfig.me`

curl 执行失败时返回非零退出码；错误信息输出到标准错误（或使用 `--json` 参数时输出到 `error.message` 字段）。

# mihomo2clash — 帮助

```
mihomo2clash convert [选项]      把 mihomo.yaml 转成标准 Clash 配置
mihomo2clash check [--json]      试运行：只报告保留 / 丢弃 / 改写的内容
mihomo2clash --help
```

## 选项

| 选项 | 默认 | 说明 |
|------|------|------|
| `-i, --in <file>` | `~/cicy-ai/db/mihomo.yaml`（`$MIHOMO_CONFIG`） | 源配置 |
| `-o, --out <file>` | `~/projects/clash-config.yaml`（`$CICY_PROJECTS/clash-config.yaml`） | 输出；`-` 表示标准输出 |
| `--group <name>` | `default_proxy_group` | 替换 `MATCH,REJECT` 的分组；不存在时自动创建一个包含全部节点的 select |
| `--cn-direct` | 关 | 在最后的 `MATCH` 前插入 `GEOIP,CN,DIRECT` |
| `--strict` | 关 | 丢弃经典 Clash 不支持的节点类型（`vless`、`hysteria*`、`tuic`、`wireguard` 等） |
| `--port <n>` / `--socks-port <n>` | `7890` / `7891` | 输出中的端口 |
| `--allow-lan` | 关 | 输出 `allow-lan: true` |
| `--json` | 关 | 机器可读摘要（`{ok, data:{in,out,report}}`） |

## 转换规则

- 丢弃顶层键：`listeners`、`authentication`、`skip-auth-prefixes`、`external-ui`、`bind-address`、`mixed-port`、`tun`、`sniffer` 及其他 mihomo 专有调优键；未知键原样透传。
- 保留 `dns`；特权端口 `:53` 改为 `0.0.0.0:1053`。
- 类型为 `direct` / `reject` / `dns` 的节点丢弃，引用它们的分组改为 `DIRECT`（去重）。
- 丢弃 `IN-NAME`、`IN-USER`、`IN-USER-PREFIX`、`IN-TYPE`、`IN-PORT`、`SUB-RULE`、`AND`/`OR`/`NOT`、`RULE-SET`、`DSCP` 规则；只被这些规则引用的分组一并丢弃，能从保留规则（递归）到达的分组保留。
- `MATCH,REJECT` 改为 `MATCH,<group>`；没有 `MATCH` 时自动补一条。
- 输出文件权限 `0600`，内含节点凭据。

## 退出码

`0` 成功 · `1` 源文件无法读取/解析 · `2` 用法错误

# WeChat SCRM

微信私域 SCRM 的命令行入口。读数据走本地数据源 API(`:8900`),设备操作转发给 `scrm` Go 二进制。

```sh
scrm unread                     # 总未读 + 真人每人未读
scrm sessions --real --unread
scrm session <名字> --ocr
scrm state
scrm inbox                      # 真人未读 → 简报发客服主管
scrm sync sessions | scrm feed | scrm archive --only <名字>
```

见 [SKILL.md](./SKILL.md) · [references/help.md](./references/help.md) · [references/tools.md](./references/tools.md)。

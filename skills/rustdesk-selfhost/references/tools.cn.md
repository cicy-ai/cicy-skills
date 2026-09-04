# rustdesk-selfhost — 配置、端口与排错

## 配置文件

`~/cicy-ai/db/rustdesk-selfhost.json`（权限 0600，不提交）：

```json
{
  "host": "rd.example.com",
  "key": "<服务器 id_ed25519.pub>",
  "password": "<无人值守密码>",
  "idPort": 21116,
  "relayPort": 21117,
  "dataDir": "/home/you/rustdesk-data"
}
```

- `host` — 客户端指向的域名或 IP。推荐用域名：服务器 IP 变了也不用改任何客户端。
- `key` — 服务器公钥，`server-up` 自动填入。
- `password` — 下发到被控端的永久（无人值守）密码。

## 端口

| 端口 | 协议 | 作用 | 说明 |
|---|---|---|---|
| 21115 | tcp | NAT 类型探测 | 加速打洞；缺了会退回中继 |
| 21116 | tcp + **udp** | ID / 会合 | **UDP 是心跳——必须放行，否则设备显示离线** |
| 21117 | tcp | 中继 | 打洞失败时的数据通道 |
| 21118 | tcp | ID 网页客户端 | 可选 |
| 21119 | tcp | 中继网页客户端 | 可选 |
| 21114 | tcp | Pro API | 开源版 hbbs 不监听；被防火墙挡住无影响 |

## 服务端文件（在 `dataDir`）

- `id_ed25519` / `id_ed25519.pub` — 服务器密钥对。公钥就是客户端要配的 key。
  **务必备份。** 删掉 = 新 key = 所有客户端失效，直到重新下发。
- `db_v2.sqlite3` — peer 注册表（谁注册过）。

## 排错对照表

| 现象 | 原因 | 处理 |
|---|---|---|
| 服务器日志 `Key 不匹配` / `invalid key` | 客户端 key ≠ 服务器当前 key | 用 `rustdesk-selfhost key` 重新下发给所有客户端；别随意重建密钥对 |
| 卡在"正在连接"，服务器日志无 relay/punch | 设备对服务器离线 = UDP 心跳被挡 | 放行 **udp:21116**（见 `firewall`） |
| 连上后 `Failed to secure tcp` | 控制端用了旧 key | 在控制端界面填当前 key，重启 RustDesk |
| 外网客户端卡住、局域网正常 | hbbs 广播的中继是局域网 IP | `server-up --relay <公网host>` |
| 用域名连不上 | 云端 DNS 记录开了 HTTP 代理 | A 记录设为 DNS-only（灰云） |
| 被控端远程改不了配置 | 服务配置需要管理员+UAC | 用 `enroll-script`，在机器上以管理员运行 |
| `check` 显示 `keypair_consistent: false` | 私钥损坏/过短 | `server-down`，删 `dataDir`，重新 `server-up`，再下发 key |

## 控制端 vs 被控端

- 控制端配置只有在**界面**里填才生效。
- 被控端配置必须写入 **LocalService** profile
  （`C:\Windows\ServiceProfiles\LocalService\...\RustDesk2.toml`），需要管理员权限。
  `ps1` 会写两份 profile；`enroll-script` 在 UAC 授权下完成。

## 相关

- `cf` — 为端点创建 DNS-only 的 A 记录。
- RustDesk 官方文档：https://rustdesk.com/docs/zh-cn/self-host/

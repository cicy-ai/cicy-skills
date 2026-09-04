# rustdesk-selfhost — 命令参考

`rustdesk-selfhost <命令> [参数]`

## 服务端（在有公网 IP 的服务器上执行；需要 docker）

| 命令 | 作用 |
|---|---|
| `server-up --relay <host>` | 用 docker 启动 `hbbs`+`hbbr`（host 网络）。把 `<host>:21117` 作为中继地址广播。等待生成密钥对并把公钥存入配置。可选 `--data <目录>`（默认 `~/rustdesk-data`）。 |
| `server-down` | 停止并删除 `hbbs`/`hbbr` 容器。 |
| `key` | 从磁盘打印当前服务器公钥（权威值）。 |
| `check` | JSON 报告：运行中的容器、tcp/udp 端口监听状态、密钥对是否自洽（私钥后 32 字节须等于公钥）。 |
| `firewall [gcloud\|iptables]` | 打印防火墙规则，**始终包含 udp:21116**。`gcloud` 打印 `firewall-rules create` 命令；`iptables` 打印 `-A INPUT` 规则；无参数打印端口清单。 |

## 客户端产物

| 命令 | 用于 | 输出 |
|---|---|---|
| `client-config` | 控制端机器 | 供手动填入 RustDesk 界面的 ID/中继/Key。 |
| `client-toml` | 被控端 | `[options]` 段 TOML 三行（`key` / `custom-rendezvous-server` / `relay-server`）。 |
| `ps1` | 被控端（有提权代理） | 写入服务与用户两份配置并重启服务的 PowerShell。 |
| `enroll-script` | 无法远程提权的被控端 | 一键 Windows `.bat`（CRLF）。用户右键 → 以管理员身份运行。 |

## 配置

| 命令 | 作用 |
|---|---|
| `config` | 打印当前端点/配置（显示 key，密码掩码）。 |
| `config k=v ...` | 设置字段：`host`（域名或 IP）、`key`、`password`、`idPort`(21116)、`relayPort`(21117)、`dataDir`。 |
| `status` | 服务端与端点状态（JSON）。 |

## 典型流程

```sh
rustdesk-selfhost server-up --relay rd.example.com
rustdesk-selfhost firewall gcloud          # 执行打印出来的规则
rustdesk-selfhost config host=rd.example.com password=<密码>
rustdesk-selfhost check                    # 端口全 true，keypair_consistent true
rustdesk-selfhost client-config            # 填入控制端界面
rustdesk-selfhost enroll-script > fix.bat  # 需要现场注册的机器
```

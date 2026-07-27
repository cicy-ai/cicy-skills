# cicy-mihomo — 帮助

## 命令

```
cicy-mihomo install [--force]            将 mihomo 二进制文件下载到 ~/.local/bin
cicy-mihomo template                     打印 YAML 模板（不写入）
cicy-mihomo gen-config [--force]         将模板写入 ~/cicy-ai/db/mihomo.yaml
cicy-mihomo show-config                  显示当前配置
cicy-mihomo status [--json]              进程ID / 二进制文件 / 配置 / 控制器状态
cicy-mihomo start                        以后台守护进程启动 mihomo
cicy-mihomo stop                         发送 SIGTERM（5秒后发送 SIGKILL）
cicy-mihomo restart                      stop + start
cicy-mihomo reload                       通过控制器 PUT /configs?force=true 热重载
cicy-mihomo logs [N|-f]                  查看尾部日志
cicy-mihomo test [--json]                测量到 anthropic / google / github / cf 的延迟

cicy-mihomo listeners [--json]           列出已配置的监听器及 IN-NAME 规则映射

cicy-mihomo add-chrome-profile <name> [--port N] [--upstream G] [--listen ADDR]
                                         追加监听器 + 代理组 + IN-NAME 规则
cicy-mihomo remove-chrome-profile <name> 移除监听器 + 代理组 + 规则

cicy-mihomo addProxy name=<id> type=<adapter> server=<host> port=<n> [k=v ...]
                     [--group <group>|--no-group]
                                         在 proxies: 下追加一个节点，并将其添加到
                                         代理组中（默认：default_proxy_group）
cicy-mihomo addGroup <name> <member...>  新增或更新 `select` 代理组（同名覆盖；
                                         成员 = 节点/代理组/DIRECT）
cicy-mihomo addUser <user> <target> [<password>]
                                         新增或更新认证条目 + IN-USER 规则
                                         （无密码 → 生成并打印一次）

cicy-mihomo --help / -h / help
cicy-mihomo tools
```

## 每个 Chrome 配置文件的流程（1.1.0+ 版本）

Chrome 拒绝接受带用户名/密码的代理。解决方法：为每个 Chrome 配置文件
设置一个本地 mihomo 监听器，无需认证，通过 IN-NAME 进行路由。

```
1. cicy-mihomo add-chrome-profile chrome-profile-1 --upstream proxy_local
2. cicy-mihomo reload
3. 将 Chrome 配置文件 1 的代理设置为 127.0.0.1:20001（无需认证）
```

`add-chrome-profile <name> [...]` 会写入三部分内容：

- `listeners:` 条目 — `name`, `type: mixed`, `port`, `listen`
- `proxy-groups:` 条目 — `<name>-group`，选择 `<upstream>`（默认 `DIRECT`）
- `rules:` 条目**置于顶部** — `IN-NAME,<name>,<name>-group`

默认端口：最小的空闲端口 `20001+`。默认监听地址：`127.0.0.1`。
默认上游：`DIRECT`（可通过编辑 YAML 或重新添加来更改）。

## 默认值

| 键       | 值                                     |
|----------|----------------------------------------|
| 二进制文件   | `~/.local/bin/mihomo`                  |
| 配置文件   | `~/cicy-ai/db/mihomo.yaml`             |
| 进程ID   | `~/.local/state/cicy-skills/mihomo/pid` |
| 日志文件   | `~/logs/mihomo.log`                    |
| 端口     | `9001`（混合模式）                      |
| 控制器   | `http://127.0.0.1:19001`               |

## 环境变量

- `MIHOMO_BIN`              — 覆盖二进制文件路径
- `MIHOMO_CONFIG`           — 覆盖配置文件路径
- `MIHOMO_LOG`              — 覆盖日志文件路径
- `MIHOMO_CTRL`             — 覆盖控制器 URL
- `CICY_MIHOMO_VERSION`     — 固定安装的发布标签（默认 `v1.10.2`）
- `CICY_MIHOMO_RELEASE_URL` — 覆盖直接下载 URL
- `GITHUB_PROXY`            — github.com 代理前缀（默认 `https://gh-proxy.com/`）

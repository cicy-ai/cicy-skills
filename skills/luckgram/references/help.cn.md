# luckgram — 帮助

## 配置

```
luckgram config --local --token-stdin         保存到这台电脑上 Luckgram 桌面版的连接
luckgram config --cloud --token-stdin         保存到云端的连接（云端密钥下的所有电脑）
luckgram config --cloud --backup --token-stdin   通过备用地址连云端（luckgram.cc 打不开时）
luckgram config --url <URL> --token-stdin [--profile <名称>]   任意地址，存成一个配置
luckgram config --use <配置名>                设为默认配置
luckgram status [--json]                      配置（令牌打码）、连接状态、工具数量
```

令牌只从标准输入读取，不接受写在命令行里：

```bash
luckgram config --local --token-stdin      # 粘贴访问令牌，回车，Ctrl-D
```

令牌从哪来：Luckgram 桌面版 → 设置 → Luckgram 功能 → **本机 MCP 接口** → 复制访问令牌；云端则打开「通过云端连接」→ 复制云端密钥。

## 账号

```
luckgram devices                              云端密钥下的电脑（仅云端）
luckgram accounts                             已登录账号：序号、id、昵称、用户名、手机号、未读、是否当前
luckgram active                               窗口当前显示的账号
luckgram switch <id|@用户名|+手机号|#序号>     切换当前账号
```

## 好友

```
luckgram friends list [--query <文字>] [--limit N] [--offset N]        Skill：friends
luckgram friends find <@用户名|+手机号>                                Skill：friends          每小时 30 次，每天 100 次
luckgram friends add <id|@用户名|+手机号> [--first <名>] [--last <姓>]  Skill：friends_manage   每小时 5 次，每天 20 次
luckgram friends remove <id|@用户名>                                   Skill：friends_manage   每小时 20 次，每天 50 次
```

## 会话

```
luckgram chats list [--unread] [--limit N] [--offset N]   Skill：chats
luckgram chats read <会话>                                 Skill：chats_manage   每小时 60 次，每天 500 次
```

## 消息

```
luckgram messages get <会话> [--limit N] [--before <消息 id>]    Skill：messages（不会标记已读）
luckgram messages send <会话> <文字…> [--reply-to <消息 id>]     Skill：messages_send   每小时 30 次，每天 200 次
luckgram messages send <会话> --stdin                            长文本或多行文本从标准输入读
```

## 群组、频道、资料

```
luckgram groups join <@用户名|会话 id>        Skill：groups    每小时 5 次，每天 20 次
luckgram groups leave <@用户名|会话 id>       Skill：groups    每小时 10 次，每天 30 次
luckgram profile set [--first <名>] [--last <姓>] [--bio <简介>]   Skill：profile   每小时 5 次，每天 10 次
```

`--last ""` 或 `--bio ""` 表示清空。

## 机器人（@BotFather）

```
luckgram bots list                                              Skill：botfather
luckgram bots create <用户名> --name <显示名称> [--out <文件>]     每小时 3 次，每天 10 次
luckgram bots token <机器人> [--revoke] [--out <文件>]           取 API 令牌；--revoke 重置为新令牌
luckgram bots set <机器人> [--name <名称>] [--description <说明>] [--about <简介>] [--privacy on|off] [--groups on|off]
luckgram bots commands <机器人> 'start=开始' 'help=使用说明' …     （--clear 清空全部命令）
luckgram bots delete <机器人> --confirm <机器人>                  无法撤销；每小时 3 次，每天 10 次
luckgram botfather send <文字…>                                  发一条命令或回答，返回它的回复和按钮
luckgram botfather press <消息 id> <按钮文字…>                    点它某条消息下的按钮
luckgram botfather read [--limit N]                              这个会话的最近消息
```

`--out <文件>` 把机器人令牌写进只有你能读的文件，输出里只显示打码后的令牌。

## 原始调用

```
luckgram tools                                服务端的工具和说明
luckgram call <工具> ['<JSON 参数>']          调用任意工具，输出它的 JSON
luckgram calls                                云端密钥的调用审计（仅云端）
```

## 通用参数

| 参数 | 含义 |
|---|---|
| `--account <id>` | 对哪个已登录账号操作。默认是当前账号。 |
| `--device <名称>` | 云端的哪台电脑。只有一台在线时可以不填。 |
| `--profile <名称>` | 用哪个已保存的连接。默认是标为默认的那个。 |
| `--json` | 输出工具返回的 JSON，而不是文字。 |

## 示例

```bash
# 读一个会话，然后回复
luckgram chats list --account 7943234085
luckgram messages get 562953914961921 --account 7943234085 --limit 20
luckgram messages send 562953914961921 "收到，谢谢" --account 7943234085 --reply-to 4812

# 加一个联系人
luckgram friends find @someone --account 7943234085
luckgram friends add @someone --account 7943234085

# 云端有两台电脑
luckgram devices
luckgram accounts --device "办公室电脑"
```

## 退出码

| 退出码 | 含义 |
|---|---|
| 0 | 完成 |
| 1 | 工具拒绝：该账号没开这个 Skill、触发频率上限、找不到、应用被密码锁住 |
| 2 | 用法错误 |
| 3 | 还没保存连接（`luckgram config`） |
| 4 | 连不上服务端，或令牌被拒绝 |

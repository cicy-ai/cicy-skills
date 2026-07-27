# feishu-cli — 帮助信息

这是对官方飞书/Lark CLI（`@larksuite/cli`，二进制命令 `lark-cli`）的封装。
它引导启动 CLI 并通过 `run` 转发实际命令，同时自动处理 `*.feishu.cn` 的代理绕过。

## 封装命令

```
feishu-cli install [--force]      通过 @larksuite/cli 安装官方 lark-cli
feishu-cli config [-- ...]        配置应用凭证  → lark-cli config init
feishu-cli auth   [-- ...]        OAuth 登录，打印认证 URL → lark-cli auth login --recommend
feishu-cli status [--json]        显示安装和认证状态
feishu-cli run <lark 参数...>     运行任意 lark-cli 命令（自动处理代理绕过）。别名：x
feishu-cli --help / -h / help     打印此帮助信息
```

`-- ...` 会将额外标志转发给固定的子命令：

```
feishu-cli config -- --new       # → lark-cli config init --new
feishu-cli auth   -- --no-wait   # → lark-cli auth login --no-wait
feishu-cli auth   -- --domain calendar,task
```

## 首次设置

```
feishu-cli status                # 已安装？已认证？
feishu-cli install               # 1. 安装 lark-cli
feishu-cli config -- --new       # 2. 创建/配置应用（打印一个验证 URL — 请打开它）
feishu-cli auth                  # 3. OAuth 登录（打印一个授权 URL — 请打开它）
feishu-cli status                # 4. 确认已认证
```

`config` 和 `auth` 都会打印一个需要在浏览器中打开的 URL；该命令会阻塞直到你在浏览器中完成操作。如果作为代理驱动，请在后台运行它们并转发该 URL。

## 真实的 API 调用 — `feishu-cli run`

`run` 之后的所有内容都会逐字传递给 `lark-cli`；代理绕过会自动应用。
无需 `env -u …` 前缀。有三个命令层级：

```
# 快捷命令（以 + 为前缀） — 高级，推荐使用
feishu-cli run calendar +agenda
feishu-cli run im +messages-send --chat-id oc_xxx --text "Hello"

# API 命令 — 领域 + 资源 + 动词
feishu-cli run calendar calendars list

# 原始 API
feishu-cli run api GET /open-apis/calendar/v4/calendars --format json
```

### 发现命令

```
feishu-cli run <领域> --help            # 列出某个领域的命令/快捷方式
feishu-cli run <领域> <命令> --help      # 某个命令的确切标志
feishu-cli run doctor                     # 健康检查：配置、认证、连接性
feishu-cli run schema ...                 # 查看 API 参数/类型/权限范围
```

领域：`api approval apps attendance auth base calendar config contact docs doctor
drive event im mail markdown minutes okr profile schema sheets slides task update vc
whiteboard wiki`。

## 操作手册（经过验证的方案）

### 电子表格 (Sheets)

```
# 使用标题行和初始数据创建 → 返回 spreadsheet_token 和 url
feishu-cli run sheets +create --title "名单" \
  --headers '["姓名","部门","邮箱"]' \
  --data '[["张三","研发","a@x.com"],["李四","产品","b@x.com"]]'

# 查看详情 — sheet_id 位于 data.sheets.sheets[].sheet_id
feishu-cli run sheets +info --spreadsheet-token <TOKEN>

# 追加行 — 需要 --sheet-id（来自 +info）
feishu-cli run sheets +append --spreadsheet-token <TOKEN> --sheet-id <SHEET_ID> \
  --range A1:C1 --values '[["王五","设计","c@x.com"]]'

# 读取 / 导出
feishu-cli run sheets +read   --spreadsheet-token <TOKEN> --range '<sheetId>!A1:C10'
feishu-cli run sheets +export --spreadsheet-token <TOKEN>
```

### 文档 (Docx)

```
# 从 Markdown 创建（标题来自第一个 "# H1"）→ 返回 docx url
cat doc.md | feishu-cli run docs +create --api-version v2 --doc-format markdown --content -
feishu-cli run docs +create --api-version v2 --doc-format markdown --content @doc.md

# 获取 / 更新现有文档
feishu-cli run docs +fetch  --api-version v2 ...
feishu-cli run docs +update --api-version v2 ...
```

⚠️ 文档 **v1 已弃用** — 务必传递 `--api-version v2`。v2 使用 `--content`（以及 `--doc-format xml|markdown`），而不是 v1 的 `--markdown`。v2 中没有 `--title`；标题是第一个 `#` 标题。

### 消息 (IM)

```
feishu-cli run im +messages-send --chat-id oc_xxx --text "Hello"
feishu-cli run im +messages-send --user-id ou_xxx --markdown "**hi** `code`"
feishu-cli run im +messages-send --chat-id oc_xxx --image ./pic.png
feishu-cli run im +chat-search --query "项目群"          # 通过名称查找 chat_id
feishu-cli run im +chat-messages-list --chat-id oc_xxx
```

### 日历 (Calendar)

```
feishu-cli run calendar +agenda                          # 今日议程
feishu-cli run calendar +create --summary "周会" ...     # 查看 --help 获取时间标志
feishu-cli run calendar +freebusy ...                    # 空闲/忙碌 + RSVP 状态
```

对于 base / drive / mail / task / wiki / vc / slides / minutes / okr / approval /
attendance / contact，同样的模式适用 — `feishu-cli run <领域> --help` 列出 `+快捷方式`，然后对某个快捷方式使用 `--help` 查看确切标志。

## 常用标志（适用于大多数 `run` 命令）

```
--format json|ndjson|csv     输出格式（默认 json）
-q, --jq '<表达式>'          使用 jq 过滤 JSON 输出
--as user|bot                以用户或应用机器人的身份操作
--dry-run                    打印请求但不执行
```

如果任何参数与 feishu-cli 自身的标志冲突，请在 lark 参数前使用 `--`：
`feishu-cli run -- status --json`。

## 退出代码

```
0  成功
1  通用失败（安装程序 / lark-cli 错误）
2  用法错误（未知子命令，或 `run` 没有参数）
3  lark-cli 未安装（请运行 `feishu-cli install`）
4  未找到 npx（请先安装 Node.js）
```

`run` 会原样传递 lark-cli 自身的退出代码。

## 注意事项

- 凭证由 lark-cli 自身管理：在可用时使用操作系统原生的密钥链，
  否则在无头主机上使用本地文件 `~/.lark-cli/config.json`。不使用 cicy-ai 数据库文件；
  永远不要打印该文件。
- **代理：** lark-cli 与 `*.feishu.cn` 通信，这会通过非中国代理出口重置（`EOF`）。`feishu-cli`
  在它运行的每个命令（config/auth/status/run）中都会剥离代理，因此这是自动完成的；设置
  `FEISHU_CLI_KEEP_PROXY=1` 可选择退出。只有原始的 `lark-cli` 调用需要手动前缀：
  `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy NO_PROXY=feishu.cn,larksuite.com lark-cli ...`
- `feishu-cli auth` 会打印一个授权 URL — 将其转发给用户以便在浏览器中批准；
  该命令在批准完成后退出。
- `feishu-cli run update` 会升级 lark-cli 及其捆绑的代理技能。

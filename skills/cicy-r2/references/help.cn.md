# cicy-r2 — 子命令参考

所有命令均从 `~/cicy-ai/db/r2.json` 读取账户/存储桶/凭证信息。

## info

```bash
cicy-r2 info
```

输出当前生效的配置，其中 `account_id` 和 `api_token` 会被脱敏。用于在执行任何写操作前确认已连接的存储桶及公开URL。

## put

```bash
cicy-r2 put <key> <local-file>
```

将 `<local-file>` 上传到存储桶，路径为 `<key>`。键名可包含 `/`（会创建嵌套的"文件夹"结构）。底层调用：`wrangler r2 object put`。

示例：
```bash
cicy-r2 put app/v3/assets/index-ABC.js dist/assets/index-ABC.js
```

## get

```bash
cicy-r2 get <key> [out]
```

下载对象 `<key>`。`out` 参数默认为 `./<basename(key)>`。

## delete

```bash
cicy-r2 delete <key>
```

删除对象 `<key>`。可通过 `curl -sI "$(cicy-r2 url <key>)"` 验证是否返回 404 状态码。

## url

```bash
cicy-r2 url <key>
```

输出格式为 `{public_url}/{key}`。纯字符串操作，不涉及网络请求。可配合 curl 使用：
```bash
curl -sI "$(cicy-r2 url binaries/manifest.json)"
```

## list

```bash
cicy-r2 list [prefix]
```

列出对象，可通过键名前缀进行可选过滤。使用 Cloudflare REST API（`GET /accounts/{acc}/r2/buckets/{bucket}/objects`）并携带 Bearer 格式的 `api_token` 认证——无需 S3 凭证。通过游标实现分页，打印每个对象的键名及大小，最后显示总计数量和体积摘要。

```bash
cicy-r2 list                # 列出所有对象
cicy-r2 list app/v3/        # 仅列出 app/v3/ 下的对象
```

## bucket-create / bucket-list

```bash
cicy-r2 bucket-create <name>
cicy-r2 bucket-list
```

创建/列出账户中的存储桶。

## domain-list

```bash
cicy-r2 domain-list
```

列出当前存储桶关联的自定义域名及其 SSL 状态。执行 `wrangler r2 bucket domain add` 后，SSL 证书约 4 分钟自动签发；需确认 `ssl_status` 显示为 `active`。

## 后端说明

- wrangler 运行于 `/home/cicy/projects/cicy-desktop/workers/render` 路径（需存在 `node_modules/wrangler`）。若目录发生变更，需修改脚本中的 `wrangler()` 函数。
- wrangler 3.x 版本每次调用都会输出过期警告——不影响正常使用。
- `api_token` 是具有 R2 管理权限的 Cloudflare Bearer 令牌，驱动所有子命令操作（包括 wrangler 操作和 REST 列表查询）。无需 S3 访问密钥/私钥（该凭证仅用于 rclone 等第三方 S3 工具，本 CLI 不涉及此类工具）。

## 迁移背景

本存储桶将替代腾讯云 COS 用于全球静态资源分发。COS 配置迁移时（主机替换为 `r2.deepfetch.de5.net`，路径结构保持不变）：

| 旧版 COS URL 前缀 | 新版 R2 前缀 |
|---|---|
| `cicy-1372193042.cos.ap-shanghai.myqcloud.com/app/v3/` | `r2.deepfetch.de5.net/app/v3/` |
| `.../binaries/` | `r2.deepfetch.de5.net/binaries/` |
| `.../mihomo/` `.../rootfs/` `.../ttyd/` `.../installers/` | 保持相同路径结构至 R2 主机 |

COS 在欠费状态下会冻结 GetObject 接口（包括已签名的请求），因此批量迁移 COS→R2 需先充值 COS，或直接将新版发布资源上传至 R2 并等待旧版客户端自然迁移完毕。

## wrangler `--remote`

`put` / `get` / `delete` 一律带 `--remote`。从 wrangler 4 起，`r2 object`
系列命令默认操作**本地模拟存储**（wrangler 工作目录下的
`.wrangler/state/v3/r2/`）：put 会打印 "Upload complete"，但真实 bucket 里
什么都没有，`list`（走 REST API）和公开 URL 都看不到它。手工调用 wrangler
时记得自己加 `--remote`。

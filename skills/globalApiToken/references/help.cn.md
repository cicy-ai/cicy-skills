## 语法概览

```
globalApiToken <show|refresh> [--json]
globalApiToken --help
```

## 命令

### `show`

打印 `~/cicy-ai/global.json` 中的当前 `api_token`。

- exit 0  → 已打印
- exit 1  → 文件损坏
- exit 3  → 文件缺失或 `api_token` 字段缺失

### `refresh`

用新的32字节随机令牌（base64url编码，长度43）替换 `api_token`。
如果文件不存在则创建。权限强制设为 0600。

- exit 0  → 已打印（新令牌）

## 选项

- `--json` — 输出 `{ ok, data }` 格式包络，而非纯文本

## 环境变量

- `CICY_GLOBAL_JSON` — 覆盖默认路径（~/cicy-ai/global.json）

## 使用示例

```bash
# 打印令牌
globalApiToken show

# 获取JSON格式
globalApiToken show --json
# → {"ok":true,"data":"abc123..."}

# 轮换令牌
globalApiToken refresh --json
# → {"ok":true,"data":{"api_token":"...","path":"...","refreshed_at":"..."}}
```

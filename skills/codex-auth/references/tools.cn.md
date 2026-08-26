# codex-auth — 涉及的文件与相关命令

## 会读写的文件

| 路径 | 用途 |
|------|------|
| `~/.codex/auth.json` | Codex 的实际凭据,`export` 读它,`import` 写它 |
| `~/.codex/auth.json.bak-<时间戳>` | `import` 自动留下的备份 |
| `~/cicy-ai/assets/codex-auth-<时间戳>.b64` | `export` 的默认输出,权限 0600 |

`CODEX_AUTH_PATH` 可覆盖凭据路径。

## 退出码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | 用法错误、base64 非法,或解码结果不是 JSON 对象 |
| 2 | 凭据文件(或输入文件)不存在 |

## 导出文件怎么处理

base64 是编码不是加密,`.b64` 文件的敏感程度和凭据本身完全一样。用可信渠道传输,
还原之后立刻删除。**不要**贴进 issue、聊天记录或截图。

## 相关

- `cicy-code` 设置页里有同样的还原入口,直接粘贴 base64,不必落地成文件。
- 配对的另一个 skill:`claude-auth`。

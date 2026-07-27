# feishu-cli — 工具

## 子命令 → 原生 lark-cli

| 子命令                   | 运行命令                                  | 说明                                               |
|------------------------|----------------------------------------|----------------------------------------------------|
| `install`              | `npx -y @larksuite/cli@latest install` | 下载平台 Go 二进制文件；幂等操作                       |
| `install --force`      | 同上，即使已安装也会重新执行                | 重新安装 / 升级                                     |
| `config`               | `lark-cli config init`                 | 交互式应用凭证设置                                   |
| `config -- --new`      | `lark-cli config init --new`           | 适用于代理的非阻塞版本                               |
| `auth`                 | `lark-cli auth login --recommend`      | 打印 OAuth URL；转发给用户                           |
| `auth -- <flags>`      | `lark-cli auth login <flags>`          | 例如 `--no-wait`、`--domain calendar,task`            |
| `status`               | `lark-cli --version` + `lark-cli auth status` | 仅报告信息；未安装时使用安全                |
| `run <args...>` / `x`  | `lark-cli <args...>`                   | 通用透传；退出码 + stdio 透明传递                     |

## 代理处理

每次调用 lark-cli（`config`、`auth`、`status`、`run`）时，都会移除代理环境变量，并将 `feishu.cn,larksuite.com,feishu.com,larkoffice.com` 添加到 `NO_PROXY`，以便调用直接使用主机的出口网络（中国品牌端点通过海外代理出口重置）。`install` 保持原始环境（npm/CDN 通过代理工作）。使用 `FEISHU_CLI_KEEP_PROXY=1` 可覆盖此行为。

## 转发规则

- `config` / `auth`：在字面 `--` 之后的任何内容都会附加到固定子命令（`config init`、`auth login`）。如果没有额外参数，则使用默认值（`auth login --recommend`）。
- `run`：整个剩余部分（减去可选的前导 `--`）将原样传递给 `lark-cli`。这是进行实际 API 调用的路径——`run sheets …`、`run im …`、`run calendar …`、`run api …` 等。

## status --json 结构

```json
{
  "ok": true,
  "data": {
    "npm_package": "@larksuite/cli",
    "binary": "lark-cli",
    "installed": true,
    "version": "1.0.42",
    "authenticated": true,
    "auth_status": "..."
  }
}
```

当无法确定认证状态时（例如，lark-cli 未安装），`authenticated` 为 `null`（空值）。

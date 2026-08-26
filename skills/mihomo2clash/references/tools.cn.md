# mihomo2clash — 工具

| 工具 | 示例 | 说明 |
|------|------|------|
| `mihomo2clash convert` | `mihomo2clash convert --cn-direct` | 生成标准 Clash 配置到 `~/projects/clash-config.yaml` |
| `mihomo2clash check` | `mihomo2clash check --json` | 试运行，报告保留 / 丢弃 / 改写项 |

## 文件

- 输入：`~/cicy-ai/db/mihomo.yaml`（`MIHOMO_CONFIG` 可覆盖）
- 输出：`~/projects/clash-config.yaml`（`CICY_PROJECTS` 覆盖目录），权限 0600

## 相关

- `cicy-mihomo` — 管理源配置与运行中的代理
- `lanshare` — 把 `~/projects` 挂成 HTTP，以远程订阅方式导入该文件

# cicy-keystore — 工具说明

| 项目 | 说明 |
|---|---|
| 存储 | `~/cicy-ai/db/keystore.json`（0600），只由 cicy-code 写入 |
| 界面 | cicy-code →「密钥库」标签（唯一能填写值的地方） |
| 接口 | `GET /api/keystore`（不含值）· `POST /api/keystore/resolve`（仅供 `exec` 使用） |
| 遮盖 | 按值精确替换为 `***`，跨数据块也能识别；少于 3 个字符的值不遮盖 |

相关技能：`cf`（Cloudflare token 包装）、`github`（GitHub 账号）同样遵循「Agent 看不到密钥」的规则。

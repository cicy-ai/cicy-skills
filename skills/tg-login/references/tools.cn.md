# tg-login — 原理

- **传输**：内置极简 CDP-over-WebSocket 客户端（node `net` + `crypto`，零依赖）。
  目标来自 `http://TG_CDP_HOST:TG_CDP_PORT/json`。
- **目标选择**：`--target <id>`，否则取第一个*可见*的
  `https://web.telegram.org/k/` 页面。
- **表单驱动**：真实 CDP `Input` 键鼠事件（Telegram 输入框忽略合成事件）。
  2FA 真正的输入框是 `input.input-field-input[type=password]`，
  **不是**那两个 `.stealthy` 诱饵框。
- **验证码来源**：从接码/getcode HTML 抓 `设备验证码`、`登录时间`、`2fa/密码`；
  限频文案会让轮询退避。

文件：`~/cicy-ai/electron/account-<N>.json` 保存每个 profile 的手机号/接码
（在面板里设置时写入），本工具不写它。

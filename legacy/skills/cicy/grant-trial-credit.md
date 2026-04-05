# 给用户加试用金

适用场景：

- 客服拿到用户发来的 6 位验证码
- OpenClaw 收到客服消息后，需要给该用户发放首次登录试用金
- 要求不能重复发放，同一个用户只能加一次

原则：

- 一律走 `cicy-cloud` 后端接口 `/api/trial-claim/grant`
- 一律走标准 `Authorization: Bearer <api_token>` 鉴权
- 不直接改数据库
- 后端接口是幂等的：
  - 未发放：执行发放
  - 已发放：返回 `status=granted`，不会重复加

默认发放：

- `100 Credits`
- `granted_by=openclaw`
- `note=首次登录试用金 100 Credits`

## OpenClaw 调用方式

默认直接读取 `~/global.json` 里的 `api_token`，作为 Bearer token 发给 API。

可选环境变量：

```bash
export CICY_API_BASE="https://api.cicy-ai.com"
export TRIAL_CLAIM_ADMIN_KEY="<可选，覆盖 ~/global.json 里的 api_token>"
```

最简单调用：

```bash
grant-trial-credit 123456
```

指定额度：

```bash
grant-trial-credit 123456 100
```

指定备注：

```bash
grant-trial-credit 123456 100 "客服手动发放首次登录试用金"
```

## 返回结果

成功时会输出接口 JSON。

关键字段：

- `ok=true`
- `status=granted`
- `user_id`
- `amount_credits`

如果这个码已经发过：

- 仍然会返回成功
- `status` 依然是 `granted`
- 不会重复加试用金

如果验证码不存在：

- 返回 `404`

如果密钥不对：

- 返回 `401`
- 默认使用 `~/global.json` 里的 `api_token`
- 这个接口不再使用 `X-Tunnel-Secret`

## 给 OpenClaw 的执行规则

收到客服消息后：

1. 提取 6 位验证码
2. 调用 `grant-trial-credit <code>`
3. 如果返回 `ok=true` 且 `status=granted`
4. 回复客服“已发放”或“已存在，无重复发放”

不要做的事：

- 不要自己记“这个码有没有发过”
- 不要自己拼 SQL 改余额
- 不要再走 `X-Tunnel-Secret`
- 不要重复重试同一个码很多次

幂等由后端保证，OpenClaw 只负责调用接口。

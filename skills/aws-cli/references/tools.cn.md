# aws-cli — 工具

| Item | Value |
|---|---|
| 账号存储 | `~/cicy-ai/db/aws.json` (0600), 在 cicy-code 账户 → AWS |
| API | `GET /api/aws/accounts`, `POST /api/aws/accounts/{test,bind,inspect}` |
| Env | `CICY_API_BASE`, `CICY_API_TOKEN` (else `~/cicy-ai/global.json` api_token) |
| Child env | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_DEFAULT_REGION` |
| use 写入 | `~/.aws/credentials` + `~/.aws/config` (`[name]` and `[default]`) |

# aws-cli — tools

| Item | Value |
|---|---|
| Accounts store | `~/cicy-ai/db/aws.json` (0600), managed in cicy-code 账户 → AWS |
| API | `GET /api/aws/accounts`, `POST /api/aws/accounts/{test,bind,inspect}` |
| Env | `CICY_API_BASE`, `CICY_API_TOKEN` (else `~/cicy-ai/global.json` api_token) |
| Child env | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_DEFAULT_REGION` |
| Bind writes | `~/.aws/credentials` + `~/.aws/config` (`[name]` and `[default]`) |

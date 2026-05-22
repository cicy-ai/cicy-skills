---
name: cf
description: Secure Cloudflare API wrapper. Use cf curl to call any endpoint without exposing the api_token.
---

# Cloudflare API (cf)

> **Wrapper command:** `cf`. Subcommands: `config` / `status` / `curl` / `exec`.
> `cf curl` injects `Authorization: Bearer <api_token>` into every request — the agent never sees the raw token.

## Security: hard rules

- **NEVER cat / Read / grep / print** `~/cicy-ai/db/cf.json`. The api_token is a user secret.
- When credentials are missing, run `cf config`. It auto-creates a placeholder (chmod 600) and opens it in your editor. **Do not ask the user to paste the api_token into chat.**
- Never construct a raw `curl` command with `-H "Authorization: Bearer ..."` using a token you read from the file. Use `cf curl` instead.
- `cf status` masks the api_token — trust its output.

## Config shape

```json
{
  "api_token":  "<paste-your-cloudflare-api-token-here>",
  "account_id": "<paste-your-cloudflare-account-id-here>"
}
```

Create the token at https://dash.cloudflare.com/profile/api-tokens.

## Bootstrap

1. `cf status` — check whether config is ready.
2. `cf config` — opens the placeholder in `$EDITOR`. Walk the user through the dashboard; **never ask them to paste the token into chat**.
3. `cf curl GET /zones` — verify access by listing zones.

## Usage

```sh
cf curl GET /zones                          # → JSON
cf curl GET /zones | jq '.result[].name'
cf curl POST /zones/ZID/dns_records '{"type":"A","name":"sub","content":"1.2.3.4","ttl":1}'
cf curl DELETE /zones/ZID/dns_records/RID

cf exec npx wrangler deploy                  # spawn child with CLOUDFLARE_API_TOKEN+ACCOUNT_ID injected
```

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)

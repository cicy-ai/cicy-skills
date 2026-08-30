# tg-login — commands

## code <codeUrl>
Fetch a 接码/getcode URL once and print the device code, login time and 2fa
password. `--json` → `{ok,code,time,twofa,rateLimited,waitSeconds,empty}`.

## poll <codeUrl>
Poll the URL until a 5-digit code appears, backing off on the service's
`请求过于频繁，请等待 N 秒` rate limit (~1 request/min). Progress on stderr.

## parse [file]
Parse `phone----codeUrl` lines (also tab / comma / 2+ spaces separated); file
or stdin. Emits `{phone, codeUrl}` rows.

## targets
List the open Telegram Web CDP page targets (id + title) so you can pin one
with `--target`.

## login <phone> <codeUrl> [--2fa <pw>] [--code <c>] [--target <id>]
Drive one profile's Telegram view end to end: switch to phone-number login,
type the phone, request the code, read it from `<codeUrl>` (or use `--code`),
type it, then fill the 2FA cloud password if the account has one. Exit 0 when
the chat list is present, 2 otherwise. Steps print on stderr.

Env: `TG_CDP_HOST` (127.0.0.1), `TG_CDP_PORT` (9221). `--json` on any command.

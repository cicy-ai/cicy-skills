# telegram-web — command reference

Syntax: `telegram-web [shared options] <command> [command options]`

Shared options: `--client ID` selects an agent client; `--target winId|wc:id` selects a target; `--win N` is the numeric-window alias; `--backend a|k` overrides detection; `--json` emits compact JSON; `--apply` authorizes mutation.

Commands:

- `login [--from-profile N] [--to-account N] [--proxy URL|--no-proxy] [--url URL] [--from-client ID] --apply`: copy Chrome Telegram localStorage into a new/reused Electron profile and patch it. Defaults: source profile `0`, account `99`, no proxy, URL `https://web.telegram.org/a/`. Pass `--proxy URL` explicitly when required; `--from-client` is reserved metadata.
- `status`: report patch/session readiness.
- `patch`: install/refresh the detected backend hook.
- `account`: return the current normalized account.
- `chats`: list normalized chats.
- `dialogs [--folder active|archived] [--limit N]`: list ordered dialogs; defaults are `active` and `50`.
- `users`: list normalized users.
- `messages <chatId> [--limit N]`: list messages; default limit is `30`.
- `open <chatId> --apply`: open a Web A chat. Web K returns `UNSUPPORTED_BACKEND_ACTION`.
- `send <chatId> <text...> --apply`: send Web A text. Web K returns `UNSUPPORTED_BACKEND_ACTION`.
- `eval <expression> [--apply]`: evaluate against a frozen read snapshot by default; `--apply` is required for potentially mutating expressions.
- `close --apply`: close only the selected target and clear only its matching saved session.

Success JSON is `{"ok":true,"data":...}`. Errors are `{"ok":false,"error":{"code":"...","message":"..."}}`; usage errors exit `2`, target/auth errors normally `4`, and transport/runtime failures normally `5`.

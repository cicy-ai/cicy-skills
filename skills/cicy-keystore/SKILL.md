---
name: cicy-keystore
description: List keys and notes in the cicy-code keystore and run commands with secrets injected as env vars. Values are set only in the UI and are never printed.
---

# Cicy Keystore

> Wrapper command: `cicy-keystore`. Subcommands: `list` / `show` / `exec`.
> The user stores secrets in the cicy-code UI (**Keystore** tab). Each entry is
> `key` + `value` + `note`. You can see keys and notes, never values.

## Hard rules

- **Never ask the user to paste a secret into chat or a command line.** If a key
  is missing or not set, tell the user to add it in the cicy-code UI → Keystore
  tab, and say which key name and what note to use.
- There is no `set` / `get`. Do not try to read `~/cicy-ai/db/keystore.json`
  or call `/api/keystore/resolve` yourself.
- Use a value only through `cicy-keystore exec`. Never put a secret in argv,
  never `echo` it, never write it to a file in the workspace.

## Usage

```sh
cicy-keystore list                       # KEY  SET  NOTE
cicy-keystore show OPENAI_API_KEY        # note + status of one key
cicy-keystore exec --env OPENAI_API_KEY -- python app.py
cicy-keystore exec --env DB_PASS:PGPASSWORD -- psql -h db -U app   # KEY:VAR renames the env var
cicy-keystore exec -e GH_TOKEN -e NPM_TOKEN -- ./deploy.sh
```

`exec` puts each value into the child's **environment** only, and replaces any
occurrence of a value in the child's stdout/stderr with `***`. Values shorter
than 3 characters are not masked. Masking matches the exact value: an encoded
form (base64, URL-encoded) would not be caught, so do not print secrets at all.

## Workflow

1. `cicy-keystore list` — find the key you need from its note.
2. If it is missing or `SET` is `no`, ask the user to add it in the UI. Stop.
3. `cicy-keystore exec --env KEY -- <command>`.

Exit codes: 0 ok · 1 error · 2 key not found / not set · 3 cicy-code unreachable or auth failed.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)

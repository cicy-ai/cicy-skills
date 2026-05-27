# cicy-policy

Thin client for the cicy audit-policy backend. Talks to cicy-code on
`$PORT` (default 8008), authenticated with `~/cicy-ai/global.json#api_token`.
Same backend the UI Audit dashboard uses.

```
cicy-policy show                              # full policy JSON
cicy-policy summary                           # one-screen human view
cicy-policy patch '<json>'                    # deep-merge JSON into policy
cicy-policy set <key.path> <value>            # set one field
cicy-policy unset <key.path>                  # remove one field
cicy-policy recent [--rule R] [--agent A] [--limit N]
cicy-policy history                           # git log of ~/cicy-ai/audit
```

## Notes

- `patch` merges objects key-by-key; arrays are **replaced**, not appended —
  pass the full intended list.
- `set <value>` is parsed as JSON when possible (`true`, `42`, `"log"`,
  `["a","b"]`), otherwise treated as a bare string.
- Every write returns a `policy_hash`; the backend validates the schema,
  recomputes the hash, and fsnotify reloads the running pipeline (~200ms).
- `recent` reads `/api/audit/events`; `--rule` / `--agent` filter server-side.
- `history` only shows output once the autonomy tick has auto-committed;
  manual edits via this skill do **not** auto-commit.

## Exit codes

- `0` success
- `1` error (bad JSON, unreachable backend, HTTP error, missing key)

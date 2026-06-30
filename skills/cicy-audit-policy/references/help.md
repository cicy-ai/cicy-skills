# cicy-audit-policy

Thin client for the cicy audit-policy backend. Talks to cicy-code on
`$PORT` (default 8008), authenticated with `~/cicy-ai/global.json#api_token`.
Same backend the UI Audit dashboard uses.

```
# policy
cicy-audit-policy show                              # full policy JSON
cicy-audit-policy summary                           # one-screen human view
cicy-audit-policy patch '<json>'                    # deep-merge JSON into policy
cicy-audit-policy set <key.path> <value>            # set one field
cicy-audit-policy unset <key.path>                  # remove one field
cicy-audit-policy rule-test <regex|js> <pattern> <text>   # dry-run a matcher
cicy-audit-policy effective <agent>                 # merged policy for one agent

# logs / analysis
cicy-audit-policy events [--severity S] [--agent A] [--direction outbound|inbound] [--rule R] [--limit N] [--json]
cicy-audit-policy event <id>                        # single-event full detail
cicy-audit-policy stats                             # hits by rule / agent / severity
cicy-audit-policy snapshot <ref>                    # raw forensic snapshot (evidence)
cicy-audit-policy agents                            # agents that have events
cicy-audit-policy recent [--rule R] [--agent A] [--limit N]   # compact list
cicy-audit-policy history                           # git log of ~/cicy-ai/audit

# false positives / allow-list
cicy-audit-policy allowlist                         # show suppressions
cicy-audit-policy allowlist-add sha256:<hash> "<reason>"
cicy-audit-policy allowlist-remove <content_hash|path|agent> <value>
```

## Notes

- `patch` merges objects key-by-key; arrays are **replaced**, not appended —
  pass the full intended list.
- `set <value>` is parsed as JSON when possible (`true`, `42`, `"log"`,
  `["a","b"]`), otherwise treated as a bare string.
- Every write returns a `policy_hash`; the backend validates the schema,
  recomputes the hash, and fsnotify reloads the running pipeline (~200ms).
- `events` reads `/api/audit/events`; pass filter flags, or a raw query string
  (e.g. `events "severity=high,critical&direction=outbound"`). `--json` dumps
  full event objects instead of one line each.
- `event <id>` / `snapshot <ref>` return raw, **un-redacted** forensic detail —
  it's evidence, same trust domain as the conversation; don't leak it.
- `stats` aggregates hits by rule / agent / severity / action — use it to find
  a noisy rule or a repeat offender.
- Allow-listing only suppresses **findings** (alerts), not the underlying
  events. `allowlist-add` takes a content sha256 (the `sha256:` prefix is added
  for you if you omit it).
- `history` only shows output once the autonomy tick has auto-committed;
  manual edits via this skill do **not** auto-commit.

## Exit codes

- `0` success
- `1` error (bad JSON, unreachable backend, HTTP error, missing key)

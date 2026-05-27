# Tools

All commands hit the local cicy-code audit backend (`/api/audit/*`) with the
bearer token from `~/cicy-ai/global.json`. Read before you write — never edit
`policy.json` directly with the shell.

## show

```sh
cicy-audit-policy show
```

Print the full policy JSON (pretty-printed). Use this when you need the exact
current shape before constructing a `patch`.

## summary

```sh
cicy-audit-policy summary
```

One-screen human view: `enabled`, `fail_mode`, each `rules_override`, each
`custom_rules` (id + severity + match), `allow_list` counts, `preventive`
state, and `incident_email` config. Start here to answer "what am I running?".

## patch

```sh
cicy-audit-policy patch '{"preventive":{"enabled":true}}'
```

Deep-merge a JSON object into the current policy and POST it back. Objects
merge key-by-key; **arrays are replaced**, so pass the full intended list
(e.g. the complete `rules_override` array, not just the new entry). Prints
`ok  hash=<policy_hash>` on success.

## set

```sh
cicy-audit-policy set fail_mode closed
cicy-audit-policy set preventive.enabled true
```

Set one field by dot-path. The value is parsed as JSON when possible
(`true`/`false`, numbers, quoted strings, arrays, objects); otherwise it is
stored as a bare string. Internally builds a nested patch and calls `patch`.

## unset

```sh
cicy-audit-policy unset preventive.enabled
```

Remove one field by dot-path. Errors if the key is not present.

## recent

```sh
cicy-audit-policy recent --rule secret.bearer_token --limit 5
cicy-audit-policy recent --agent w-10001
```

List recent matched audit events (`/api/audit/events`), newest first. Each
line shows timestamp, agent id, and the rule ids that fired. Use this to
verify a rule actually fires (or stops firing) after a policy change.

## history

```sh
cicy-audit-policy history
```

`git log --oneline -n 20` of `~/cicy-ai/audit`. Only populated once the
autonomy tick has auto-committed; manual edits via this skill do not
auto-commit, so point that out if the user wants to roll back a manual change.

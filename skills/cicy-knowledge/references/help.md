# cicy-knowledge — command reference

The CLI for the team's Layer 2 knowledge store (cicy-code `/api/knowledge`).
Status machine: `pending → canon | rejected | superseded`.

## Commands

```
cicy-knowledge add "<title>"                  Add a new PENDING entry. Body comes from
   [--body <md> | --body-file <f> | stdin]    --body, --body-file, or piped stdin.
   [--tags "a b"] [--source <kind>]           --source = manual|memory-hook|harvest (default
   [--source-pane <pane>] [--origin <ref>]    manual). Prints the new id.

cicy-knowledge list                           List entries (newest first).
   [--status canon|pending|rejected|superseded]
   [--tag <t>] [-q <kw>] [--json]

cicy-knowledge recall <kw> [--tag <t>]        Keyword/tag recall over CANON only. Exact-ish
                                              match over title+tags+body — NOT vector/RAG.

cicy-knowledge get <id> [--json]              Show one entry (full body).

cicy-knowledge promote <id> [--domain <d>]    Governance (知识专员): move _inbox → canon
                                              <domain>/ folder (default "general").
cicy-knowledge reject <id>                    Governance: move → _archive/ (rejected).
cicy-knowledge supersede <oldId> <newId>      Governance: archive old, recording the new id.

cicy-knowledge specialist [<pane>]            Show or set which pane governs the store
                                              (receives memory-hook briefs). No arg = show;
                                              <pane> pins it. Config-file backed (global.json),
                                              NOT a DB role query; unset → default w-1001.
```

The store is FILE-backed (~/cicy-ai/knowledge): status = folder (_inbox = pending,
<domain>/ = canon, _archive/ = rejected). `promote` / `reject` / `supersede`
record the acting pane as `verified_by` (from `X_AGENT_SHORT_ID` when set).

## Environment

- `CICY_API_TOKEN`   — bearer token (overrides global.json)
- `CICY_API_PORT`    — local cicy-code port (default 8008)
- `CICY_GLOBAL_JSON` — global.json path override (default `~/cicy-ai/global.json`)
- `X_AGENT_SHORT_ID` — acting agent id; recorded as source_pane on add and
  verified_by on promote/reject/supersede (set inside cicy panes)

## Examples

```sh
# record + govern
id=$(cicy-knowledge add "Deploy runbook" --body-file runbook.md --tags "deploy ops" --json | jq -r .data.id)
cicy-knowledge list --status pending
cicy-knowledge promote "$id"

# recall before acting
cicy-knowledge recall deploy
cicy-knowledge recall "" --tag ops

# replace an outdated entry
cicy-knowledge supersede <oldId> <newId>
```

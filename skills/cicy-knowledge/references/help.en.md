# cicy-knowledge — command reference

The CLI for the team's Layer 2 knowledge store (cicy-code `/api/knowledge`).
Maturity (what recall trusts) is separate from location:

```
draft → pending → canon → (deprecated | rejected/superseded)
未成稿    待审      已确立      已废弃 / 已弃
```

Only `canon` is served by recall as fact. `draft`/`deprecated` drop out of recall,
so an unfinished or stale doc is never read as current reality.

## Commands

```
cicy-knowledge add "<title>"                  Add an entry. Body from --body, --body-file,
   [--body <md> | --body-file <f> | stdin]    or piped stdin. Default lands as PENDING in
   [--tags "a b"] [--source <kind>]           _inbox. --source = manual|memory-hook|harvest.
   [--source-pane <pane>] [--origin <ref>]    Prints the new id.
   [--draft]                                  --draft → lands in _drafts/ as 未成稿 (recall
                                              won't serve it; specialist won't govern it).

cicy-knowledge list                           List entries (newest first).
   [--status draft|pending|canon|rejected|deprecated]
   [--tag <t>] [-q <kw>] [--json]

cicy-knowledge recall <kw> [--tag <t>]        Keyword/tag recall over CANON only. Exact-ish
                                              match over title+tags+body — NOT vector/RAG.

cicy-knowledge get <id> [--json]              Show one entry (full body).

cicy-knowledge promote <id> [--domain <d>]    Governance (知识专员): move → canon <domain>/
                                              folder (default "general"). Clears any flag.
cicy-knowledge reject <id>                    Governance: move → _archive/ (rejected).
cicy-knowledge supersede <oldId> <newId>      Governance: archive old, recording the new id.

cicy-knowledge draft <id>                     Mark an existing entry 未成稿 IN PLACE (a
                                              frontmatter `status:` flag, no move). Drops
                                              out of canon recall while it stays filed.
cicy-knowledge deprecate <id>                 Mark it 已废弃 in place (also drops out of recall).
cicy-knowledge restore <id>                   Clear the flag → back to its folder status.

cicy-knowledge specialist [<pane>]            Show or set which pane governs the store
                                              (receives memory-hook briefs). No arg = show;
                                              <pane> pins it. Config-file backed (global.json),
                                              NOT a DB role query; unset → default w-1001.
```

The store is FILE-backed (~/cicy-ai/knowledge). Status comes from the folder
(_drafts = draft, _inbox = pending, <domain>/ = canon, _archive/ = rejected); a
frontmatter `status: draft|deprecated` flag OVERRIDES the folder so a doc can sit
under its topic yet read as not-canon. `promote`/`reject`/`supersede` record the
acting pane as `verified_by` (from `X_AGENT_SHORT_ID` when set) and clear any flag.

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

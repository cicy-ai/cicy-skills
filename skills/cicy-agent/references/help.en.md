# cicy-agent — help

## Commands

```
cicy-agent ls                                 Short list
cicy-agent capture <pane>                     Capture raw pane text
cicy-agent reply <pane|team.agent> [--full]   Last structured reply; local and Cloud
cicy-agent history <pane|team.agent>           Historical turn (latest by default)
            [--index N]                        from history.db; local and Cloud
cicy-agent msg <pane> <text>                  Send a tracked local or Cloud message, print
            [--no-wait] [--timeout S]          msg_id immediately, then wait for its structured
            [--no-callback] [--notify]         done/failed reply by default. --no-wait returns
                                              after acceptance. --notify also pushes a one-line
                                              status wake-up when the turn ends ("🔔 [B] msg <id>
                                              → done"; suppressed if they already replied).
                                              --no-callback = full
                                              fire-and-forget (no tracking, no push).
cicy-agent msgs [team.agent] [--from P]        Cross-agent message link; optional Cloud
            [--to P]                           target queries that Instance by RPC
            [--status S] [--open] [--json]     id, and a q⟶answer summary of BOTH the sender's
                                              dispatch turn (from-turn) and what the receiver
                                              did (to-turn), JOINed from each agent's history.
cicy-agent broadcast [--timeout <ms>] <text>  Group-send to ONLINE agents only (offline
                                              agents can't receive — there is no --all).
                                              Every send has a per-pane timeout (default
                                              8000ms) so dead panes can't stall the run.
                                              Skips the sender. Prints delivered/failed.
cicy-agent get_all_agents                     Roster: whole db (online ∪ offline = all)
                                              Roster rows carry {id, title,
                                              agent_type, online, model, provider,
                                              local_gateway, context_usage, cost, idle}.
                                              Runtime fields read the agent's
                                              ~/cicy-ai/workers/<id>/.cicy/history/
                                              (reply.json → idle+model, context.json →
                                              context_usage, usage.jsonl → Σcost +
                                              provider); unavailable → null / "n/a"
                                              idle is a heuristic: "thinking" or request
                                              activity <45s ago = busy.
cicy-agent send-keys <pane> <keys...>         tmux send-keys
cicy-agent projects                           List every project without expanding Agents
cicy-agent projects --current                 List the current project with nested Agents
cicy-agent projects <id|name>                 List one project with nested Agents by ID or exact name
cicy-agent restart                            Restart all panes
cicy-agent clear <pane>                       Clear pane
cicy-agent fork <src> [--title T] [--master PANE]     Replicate an agent so a new one inherits its context
cicy-agent create <title> [--type cicy] [--model M]   Create a BRAND-NEW agent from scratch (POST /api/panes/create).
            [--role R] [--role-template RT] [--master PANE]   agent_type defaults to cicy. NOT a clone — use fork to inherit context.
            --role is NOT the persona. It sets agent_config.role: a roster label shown in
              UI lists, whose magic values "worker" (default) / "master" also mark the
              pane in master/worker topology + worker-completion tracking. Free-form text
              here silently drops the "worker" marker — leave it alone unless you mean that.
            --role-template picks the PERSONA (default: assistant): the template dir
              ~/cicy-ai/memory/agents/<RT>/ whose system.md becomes the system prompt and
              whose role.md seeds the agent's AGENTS.md (edit that file to customize).

cicy-agent whoami                            Show this Agent ID, team ID, Instance ID,
                                              fixed domain and HTTPS URL.
cicy-agent --json whoami                     Machine-readable identity for scripts.

cicy-agent cloud ls [--all]                  List Cloud teams with nested Agents. Online only
                                              by default; --all includes offline teams.
cicy-agent cloud agents [--all]              Flat Cloud Agent address list.
cicy-agent msg <team.agent> <text>            A team-qualified target automatically routes through
                                              CiCy Cloud; no target instance token is required.
                                              Prints msg_id + pending immediately, then waits by default
                                              and prints msg → done plus the correlated reply.

cicy-agent --json ...                         JSON output mode
cicy-agent --help / -h / help
cicy-agent tools
```

## Environment

- `CICY_API_TOKEN`     — bearer token (overrides global.json)
- `CICY_API_PORT`      — local server port (default 8008)
- `CICY_GLOBAL_JSON`   — global.json path override
- `CICY_CLOUD_DEVICE_JSON` — Cloud login override (default `~/cicy-ai/db/cloud-device.json`)
- `X_AGENT_SHORT_ID`   — required for `msg --callback` (set inside panes)

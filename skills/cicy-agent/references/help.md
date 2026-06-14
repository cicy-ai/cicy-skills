# cicy-agent — help

## Commands

```
cicy-agent list                               List all panes (table)
cicy-agent ls                                 Short list
cicy-agent tree                               Tree (JSON)
cicy-agent windows                            Window list (JSON)
cicy-agent capture <pane>                     Capture raw pane text
cicy-agent reply <pane> [--full]              Last reply text from pane (parsed)
cicy-agent msg <pane> <text>                  Send chat message. Default: tracked in the
            [--no-callback] [--notify]         message store (status → done/failed) but NO
                                              completion chat line, and prints msg_id=<id>
                                              for later lookup. --notify also pushes a one-line
                                              status wake-up when the turn ends ("🔔 [B] msg <id>
                                              → done"; suppressed if they already replied).
                                              --no-callback = full
                                              fire-and-forget (no tracking, no push).
cicy-agent msgs [--from P] [--to P]           Cross-agent message link: who→who, status,
            [--status S] [--open] [--json]     id, and a q⟶answer summary of BOTH the sender's
                                              dispatch turn (from-turn) and what the receiver
                                              did (to-turn), JOINed from each agent's history.
cicy-agent broadcast [--timeout <ms>] <text>  Group-send to ONLINE agents only (offline
                                              agents can't receive — there is no --all).
                                              Every send has a per-pane timeout (default
                                              8000ms) so dead panes can't stall the run.
                                              Skips the sender. Prints delivered/failed.
cicy-agent get_online_agents                  Roster: agents with a live tmux session
cicy-agent get_offline_agents                 Roster: in db but no live session
cicy-agent get_all_agents                     Roster: whole db (online ∪ offline = all)
                                              Roster rows carry {id, title, duty,
                                              agent_type, online, model, provider,
                                              local_gateway, context_usage, cost, idle}.
                                              duty: role_template → cicy-team charter →
                                              title. Runtime fields read the agent's
                                              ~/cicy-ai/workers/<id>/.cicy/history/
                                              (reply.json → idle+model, context.json →
                                              context_usage, usage.jsonl → Σcost +
                                              provider); unavailable → null / "n/a"
                                              (always n/a with --node — files are remote).
                                              idle is a heuristic: "thinking" or request
                                              activity <45s ago = busy.
cicy-agent send-keys <pane> <keys...>         tmux send-keys
cicy-agent restart                            Restart all panes
cicy-agent clear <pane>                       Clear pane
cicy-agent fork <src> [--title T] [--master PANE]     Replicate an agent so a new one inherits its context

cicy-agent --node <NAME> ...                  Run against a remote node
cicy-agent --json ...                         JSON output mode
cicy-agent --help / -h / help
cicy-agent tools
```

## Environment

- `CICY_API_TOKEN`     — bearer token (overrides global.json)
- `CICY_API_PORT`      — local server port (default 8008)
- `CICY_GLOBAL_JSON`   — global.json path override
- `CICY_AGENT_JSON`    — multi-node config override (default `~/cicy-ai/db/cicy-agent.json`)
- `X_AGENT_SHORT_ID`   — required for `msg --callback` (set inside panes)

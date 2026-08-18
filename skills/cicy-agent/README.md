# cicy-agent

> Source-only Node.js, 230 LOC. Read [`bin/cicy-agent`](./bin/cicy-agent).

Operates tmux panes via cicy-code's `/api/tmux/*` REST endpoints.

## Install

```bash
cicy-code skill install cicy-agent
```

## Quick usage

```bash
cicy-agent list                  # all panes (id, agent_type, title, workspace)
cicy-agent ls                    # short variant
cicy-agent tree                  # pane → window hierarchy (JSON)
cicy-agent windows               # tmux window list (JSON)
cicy-agent capture w-1001       # raw pane text
cicy-agent reply w-1001         # last reply (parsed)
cicy-agent reply w-1001 --full  # include tool_use entries
cicy-agent reply team.w-1001    # structured Cloud reply (never capture)
cicy-agent history team.w-1001 --index 0
cicy-agent projects                       # all projects with nested agents
cicy-agent projects --current             # current agent's project
cicy-agent --json projects                # structured output

cicy-agent msg w-10002 'do this'              # prints msg_id immediately, then waits for the
                                              # structured done/failed reply
cicy-agent msg w-10002 'do this' --no-wait    # return after durable acceptance
cicy-agent msg w-10002 'do this' --notify     # also push a one-line status wake-up when the
                                              # turn ends ("🔔 [B] msg <id> → done"; suppressed
                                              # if they already replied in-band)
cicy-agent msg w-10002 'fyi' --no-callback    # fire-and-forget: no tracking, no push
cicy-agent msgs --to w-10002                  # the cross-agent message link: who→who, status,
cicy-agent msgs team.w-10002                  # query the target Instance over Cloud RPC
                                              # and a q⟶answer summary of what they did

cicy-agent send-keys w-1001 'ls -la' Enter
cicy-agent clear w-1001
cicy-agent restart                # restart_all

# CiCy Cloud instances (no target instance token needed)
cicy-agent whoami                          # this Agent/team/Instance/fixed URL
cicy-agent --json whoami                   # structured identity
cicy-agent cloud ls                         # online teams with nested Agents
cicy-agent cloud ls --all                   # include offline teams
cicy-agent msg gh_linux.w-102 'hello'        # WebSocket first; durable HTTP/D1 fallback
```

## Auth

Local: `~/cicy-ai/global.json` `api_token` (mode 0600), or `CICY_API_TOKEN` env.

Cross-Instance: `~/cicy-ai/db/cloud-device.json` Cloud session. Target Instance
API Tokens are not required.

## License

MIT

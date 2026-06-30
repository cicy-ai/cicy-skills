# agent-chrome

> Source-only Node.js. Read [`bin/agent-chrome`](./bin/agent-chrome).
> Requires Node **22+** for native WebSocket.

Per-profile system Chrome control on a connected cicy-desktop host. Each
subcommand maps to a `chrome_*` electronRPC tool, dispatched as
`desktop_event { rpc_call, tool, args, requestId }` over the chat WebSocket.

## Install

```bash
cicy-code skill install agent-chrome
```

## Quick usage

```bash
agent-chrome profiles                      # list profiles in ~/cicy-ai/db/chrome.json
agent-chrome profile 1                     # show one profile + live debugger status
agent-chrome add --gmail x@y.com --launch
agent-chrome proxy 1 socks5://127.0.0.1:1080
agent-chrome launch 1 --url https://example.com
agent-chrome close 1
agent-chrome targets --idx 1
agent-chrome cdp Page.navigate '{"url":"https://example.com"}' --idx 1
agent-chrome gmails
agent-chrome github

# Probe egress IP, infer logins, record a rich login
agent-chrome probe-ip 1                     # egress IP+area via the proxy (api.myip.com, stored)
agent-chrome detect-logins 1                # infer signed-in sites from cookies
agent-chrome login set 1 --name 抖音 --username u --email e@x.com
agent-chrome logins 1

agent-chrome --client mcp-1 ...
```

## License

MIT

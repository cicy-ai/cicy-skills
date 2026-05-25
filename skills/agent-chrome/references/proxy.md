# agent-chrome — per-profile proxy (cicy-mihomo integration)

Each entry in `~/cicy-ai/db/chrome.json` has a `proxy` field. When Chrome
launches that profile, agent-chrome passes it as `--proxy-server=<url>`.
The proxy URL **must point to something that is actually listening** —
Chrome refuses creds in the URL and produces "connect refused" errors
silently if nothing answers.

The intended architecture pairs `agent-chrome` with [[cicy-mihomo-skill]]:
each Chrome profile gets its own dedicated mihomo listener with no auth,
and mihomo's `IN-NAME` rules route that listener to the correct upstream.

## Topology

```
Chrome profile N
   │ --proxy-server=socks5://127.0.0.1:200NN
   ▼
mihomo listener  "chrome-profile-N"  (port 200NN, mixed)
   │ matched by:  IN-NAME,chrome-profile-N,chrome-profile-N-group
   ▼
proxy-group  "chrome-profile-N-group"
   │ proxies: [linux_mihomo, vpn_hk, hk_socks, ...]
   ▼
upstream proxy node  (e.g. linux_mihomo @ 127.0.0.1:19011 over SSH tunnel)
```

## Setup flow

For each Chrome profile you want behind its own listener:

```bash
# 1) Tell cicy-mihomo to expose a new listener + IN-NAME rule
cicy-mihomo add-chrome-profile chrome-profile-1 \
    --listen 127.0.0.1:20001 --upstream linux_mihomo

# 2) (workaround for cicy-mihomo ≤1.x bug — see "Pitfalls" below)
#    If `listeners:` section did not exist in mihomo.yaml, manually add it.

# 3) Restart mihomo so it picks up the new listener
cicy-mihomo restart   # NOT just `reload` — see "Pitfalls"

# 4) Point Chrome profile at the new listener
agent-chrome proxy 1 socks5://127.0.0.1:20001

# 5) Verify the listener actually answers
curl -m 10 --socks5-hostname 127.0.0.1:20001 -sI https://web.telegram.org

# 6) Relaunch the Chrome profile so the new proxy arg takes effect
agent-chrome close 1
agent-chrome launch 1 --url https://web.telegram.org
```

Port convention: `chrome-profile-N` → port `200NN`. Reserve 20001–20099
for chrome profiles; mihomo's own mixed-port is usually 9001.

## Pitfalls

These are real failure modes hit in production. Each one looks like
"Chrome won't load anything" but the root causes differ.

### 1. `proxy` field points to a port nobody listens on

`chrome.json` may carry stale port numbers like `socks5://127.0.0.1:1080`
from a previous proxy setup. Chrome happily dials, gets ECONNREFUSED, and
shows "Unable to connect to the proxy server" or just blank pages.

Fix: `lsof -nP -iTCP:<port> -sTCP:LISTEN` to confirm. If no listener,
either start one (cicy-mihomo + add-chrome-profile) or update `chrome.json`
to a port that is live.

### 2. mihomo's default route is broken

In `mihomo.yaml`, `default_proxy_group` may have `now: <node>` pointing
to a node whose backend itself is dead (e.g. `vpn_hk` pointing to local
1085 with nothing listening). Anything routed through `default_proxy_group`
silently fails with `connect refused` logged in `~/logs/mihomo.log`.

Fix: either switch `now:` to a working node (via controller PUT
`/proxies/default_proxy_group` or by editing yaml), or use a per-profile
listener whose IN-NAME rule routes to a dedicated group that does not
depend on `default_proxy_group`.

### 3. `MATCH,REJECT` as fallback rule

Common in cicy-mihomo configs as default-deny. Means any traffic not
matched by an earlier rule is dropped. In `~/logs/mihomo.log`:

```
[TCP] ... web.telegram.org:443 match Match using REJECT
```

For Chrome traffic to escape `MATCH,REJECT`, an earlier rule must
explicitly route it. The recommended way is the `IN-NAME` rule that
`cicy-mihomo add-chrome-profile` installs (which must come **before**
any `MATCH,REJECT`).

### 4. `cicy-mihomo add-chrome-profile` silently skips listener block

In cicy-mihomo ≤1.x, if `mihomo.yaml` has no top-level `listeners:`
section, the skill's `appendUnderTopKey` returns the text unchanged,
but still adds proxy-group + rule. Result: rule + group exist but no
listener — `lsof` shows nothing on the configured port, and traffic
never enters the chain.

Workaround: manually add `listeners:` block to yaml once (anywhere at
top level), then `cicy-mihomo add-chrome-profile` will append to it on
subsequent calls.

```yaml
listeners:
  - name: chrome-profile-1
    type: mixed
    port: 20001
    listen: 127.0.0.1
```

### 5. `cicy-mihomo reload` rejects non-standard config path

mihomo's controller has a SAFE_PATHS restriction. If mihomo was started
reading a config from outside `~/.config/mihomo/`, the `PUT /configs`
hot-reload returns 400 with "path is not subpath of home directory or
SAFE_PATHS". Use `cicy-mihomo restart` instead — it stops + starts via
the skill's preferred config path (`~/cicy-ai/db/mihomo.yaml`).

### 6. `chrome_set_profile_proxy` only takes effect on next launch

`agent-chrome proxy <idx> <url>` rewrites `chrome.json` but does NOT
restart a running Chrome process. The running process still has the old
`--proxy-server` baked into its argv. Always `close` then `launch`
after changing proxy.

## Quick diagnostics

```bash
# Is mihomo running and on which config?
cicy-mihomo status --json

# Which listeners + IN-NAME rules are wired up?
cicy-mihomo listeners --json

# Which port is each Chrome profile pointing at?
agent-chrome profiles --json | jq '.profiles[] | {accountIdx, proxyUrl}'

# Recent rejected/refused connections
tail -50 ~/logs/mihomo.log | grep -E "REJECT|refused"

# Test a specific listener actually answers (skip Chrome)
curl -m 10 --socks5-hostname 127.0.0.1:20001 -sI https://web.telegram.org

# Test upstream proxy nodes' reachability
cicy-mihomo test --json
```

## Related

- [[cicy-mihomo-skill]] — manage local mihomo daemon, listeners, IN-NAME rules
- `chrome.json` location: `~/cicy-ai/db/chrome.json` (was `~/Private/chrome.json` before cicy-desktop v2.1.24)
- mihomo controller: `http://127.0.0.1:19001` (per `external-controller` in yaml)

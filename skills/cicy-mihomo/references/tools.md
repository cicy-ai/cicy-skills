# cicy-mihomo — tools

## What it does

Process manager + thin controller-API client + yaml editor for mihomo's
`listeners:` / `proxy-groups:` / `rules:` blocks (per-Chrome-profile flow).

## Files touched

| op     | path                                       | mode | when                       |
|--------|--------------------------------------------|------|----------------------------|
| write  | `~/.local/bin/mihomo`                      | 0755 | `install`                  |
| write  | `~/cicy-ai/db/mihomo.yaml`                 | 0600 | `gen-config`, `add-chrome-profile`, `remove-chrome-profile`, `addProxy`, `addGroup`, `addUser` |
| read   | `~/cicy-ai/db/mihomo.yaml`                 | —    | `show-config`, `listeners` |
| write  | `~/.local/state/cicy-skills/mihomo/pid`    | 0644 | `start`                    |
| append | `~/logs/mihomo.log`                        | —    | `start`                    |

## Process management

- `start` — `spawn(BINARY, ['-f', CONFIG], { detached:true, stdio:['ignore', logFD, logFD] })` then write pid file.
- `stop`  — `process.kill(pid, 'SIGTERM')`, wait up to 5s, then SIGKILL.
- `status` — `process.kill(pid, 0)` to verify pid is alive; if alive, GET `/version` from controller for version string.

## Controller API

- `reload`: `PUT http://127.0.0.1:19001/configs?force=true` with `{ "path": "<config>" }`
- `test`:   `GET /proxies` to enumerate nodes, then `GET /proxies/<node>/delay?url=<probe>&timeout=3000` per node × probe URL

Probe URLs: `anthropic`, `google`, `github`, `cf`.

## listeners (read-only)

```
cicy-mihomo listeners
```
Parses the yaml and prints:

```
LISTENER NAME              PORT   TYPE   LISTEN          → IN-NAME GROUP
chrome-profile-1           20001  mixed  127.0.0.1       → chrome-profile-1-group
chrome-profile-2           20002  mixed  127.0.0.1       → chrome-profile-2-group
```

`--json` returns `{ base_mixed_port, listeners[], in_name_rules[], proxy_groups[] }`.

## add-chrome-profile (yaml mutation)

```
cicy-mihomo add-chrome-profile <name> [--port N] [--upstream G] [--listen ADDR]
```

1. Picks a port — explicit `--port` or smallest unused `>= 20001`.
2. Appends to `listeners:`:
   ```yaml
   - name: <name>
     type: mixed
     port: <port>
     listen: <listen|127.0.0.1>
   ```
3. Appends to `proxy-groups:`:
   ```yaml
   - name: <name>-group
     type: select
     proxies:
       - <upstream|DIRECT>
   ```
4. Inserts at top of `rules:`:
   ```yaml
   - IN-NAME,<name>,<name>-group
   ```

Validations (exit 4 on conflict):

- listener name uniqueness
- group name uniqueness
- port not already used by another listener

Name must match `^[a-zA-Z][\w-]*$` (exit 2 otherwise).

## remove-chrome-profile

Removes the matching listener entry, the `<name>-group` proxy-group entry,
and any `IN-NAME,<name>,...` rule line. Idempotent on the rule line; exit 4
if the profile doesn't exist anywhere in the yaml.

## addProxy (alias: add-proxy)

```
cicy-mihomo addProxy name=<id> type=<adapter> server=<host> port=<n> [k=v ...] \
                     [--group <group>|--no-group]
```

Appends a node under the top-level `proxies:` key (canonical block style,
`name`/`type` first, remaining k=v pairs in argument order) and adds the node
name to a proxy-group's `proxies:` selection — `default_proxy_group` unless
`--group <other>` or `--no-group`. Flat k=v pairs only; nested adapter opts
(`ws-opts`, …) are out of scope.

- `server=`/`port=` required for every type except `direct` (exit 2)
- node-name uniqueness across `proxies:` (exit 4); group must exist (exit 4)
- numbers / `true` / `false` stay bare yaml scalars; everything else is
  single-quoted
- sensitive values (`password`, `uuid`, `token`, `psk`, `private-key`, …) are
  masked as `***` in stdout/`--json` output — except literal `<PLACEHOLDER>`
  values, which print verbatim so the user knows to replace them
- prefer placeholder credentials (`password='<YOUR_PASSWORD_HERE>'`) and let
  the user substitute the real secret in an editor afterwards

Follow with `cicy-mihomo reload`.

## addGroup (alias: add-group)

```
cicy-mihomo addGroup <name> <member1> [member2 ...]
```

Upserts a `select` group under `proxy-groups:` — same name overwrites the
existing entry. Members may be proxy nodes, other groups, or
`DIRECT`/`REJECT`/`PASS`; comma- and space-separated both accepted. Unknown
members exit 4; self-reference / duplicates exit 2. Follow with
`cicy-mihomo reload`.

## addUser (alias: add-user)

```
cicy-mihomo addUser <username> <target> [<password>]
```

Upserts both halves of a user's config in one shot:

1. `authentication:` — `- "<username>:<password>"` (existing entry for the
   user is replaced; an inline-empty `authentication: []` is opened up).
   Without `<password>` a random one is generated and printed **once**;
   a user-supplied password is never echoed (`***`).
2. `rules:` — `IN-USER,<username>,<target>` inserted **above** the first
   `IN-USER-PREFIX` (or `MATCH`) line so the specific rule wins the route;
   any previous `IN-USER,<username>,…` line is removed.

`<target>` must be an existing proxy, proxy-group, or `DIRECT`/`REJECT`
(exit 4 otherwise). Follow with `cicy-mihomo reload`.

## Configuration

| path                       | mode | secret_fields  |
|----------------------------|------|----------------|
| `~/cicy-ai/db/mihomo.yaml` | 0600 | (yaml may contain proxy passwords; treat as sensitive) |

## Conventions (default template)

- `mixed-port: 9001` (the base authenticated port — IN-USER rules apply)
- `external-controller: 127.0.0.1:19001`
- `skip-auth-prefixes: [127.0.0.1/32, ::1/128]` — local Chrome / curl skip auth on the base port
- `IN-USER-PREFIX,w-,default_proxy_group` — every `w-*` user routes via default group; pin a worker by adding `IN-USER,<user>,<target>` ABOVE this line
- per-Chrome-profile listeners on `20001+` (no auth) routed by `IN-NAME` rules first
- `default_proxy_group` is a `select` group; switch active node via `PUT /proxies/default_proxy_group`

## Rule priority warning

`IN-NAME` rules MUST appear before any `IN-USER` / `IN-USER-PREFIX` rules.
Connections coming through a named listener never reach the auth-user
rules below them. `add-chrome-profile` always inserts the new
`IN-NAME` line at the top of `rules:` for this reason.

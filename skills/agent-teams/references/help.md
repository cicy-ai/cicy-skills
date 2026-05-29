# agent-teams — help

## Commands

```
agent-teams list                                         [--json]
agent-teams add --name X --base-url Y [--token T] [...]  [--json]
agent-teams update <id> [--name X] [--token X] [...]     [--json]
agent-teams remove  <id>                                 [--json]
agent-teams upgrade <id>                                 [--json]
agent-teams open    <id>                                 [--json]
agent-teams --help / -h / help
agent-teams tools
```

## Flags accepted by `add` / `update`

| flag            | maps to localTeams field |
|-----------------|--------------------------|
| `--name`        | `name`                   |
| `--base-url`    | `base_url`               |
| `--url`         | `base_url` (alias)       |
| `--token`       | `api_token`              |
| `--source`      | `install_source`         |
| `--os`          | `install_os`             |
| `--arch`        | `install_arch`           |
| `--path`        | `install_path`           |
| `--container`   | `container_name`         |
| `--image`       | `image`                  |

`add` dedupes by `base_url` — re-adding the same URL upserts (token /
install meta refresh). `update` accepts a positional `<id>` then one or
more flags.

## Output

Default: a short human line per subcommand (`✔ added local-8008  http://…`),
or for `list` a fixed-width table:

```
ID            NAME       BASE_URL                STATUS      VERSION
local-8008    本地团队    http://127.0.0.1:8008   running     2.1.8
```

With `--json`: `{ ok: true, data: <whatever-the-IPC-returned> }` or
`{ ok: false, error: "..." }` on failure.

## Environment

This skill spawns `agent-webpage` for the actual round-trip. It honours
whatever `CICY_API_TOKEN`, `CICY_API_PORT`, `CICY_PANE_ID`,
`CICY_GLOBAL_JSON`, `CICY_AGENT_TIMEOUT_MS` you have set — they're read
by agent-webpage downstream.

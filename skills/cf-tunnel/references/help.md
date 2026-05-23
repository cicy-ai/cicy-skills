# cf-tunnel — help

## Commands

```
cf-tunnel config                          Open ~/cicy-ai/db/cf.json in $EDITOR
cf-tunnel status [--json]                 Show config state
cf-tunnel list   [--json]                 List current routes (ingress + DNS)
cf-tunnel add    <port> [<port> ...]      Add g-<port>.<domain> route
cf-tunnel del    <port> [<port> ...]      Remove route
cf-tunnel --help / -h / help              Print this help
```

## Examples

```bash
# bootstrap
cf-tunnel status
cf-tunnel config
cf-tunnel list

# add routes
cf-tunnel add 8080
cf-tunnel add 5174 8010 13000

# remove
cf-tunnel del 8080

# environments
CF_ENV=dev cf-tunnel list
CF_ENV=dev cf-tunnel add 8080
```

## Environment

- `CICY_CF_CONFIG` — override config path (default `~/cicy-ai/db/cf.json`)
- `CF_ENV`         — pick `prod` (default) or `dev` (or any other key in config)
- `EDITOR`/`VISUAL` — editor for `cf-tunnel config`

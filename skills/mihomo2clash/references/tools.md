# mihomo2clash — tools

| Tool | Example | Description |
|------|---------|-------------|
| `mihomo2clash convert` | `mihomo2clash convert --cn-direct` | Write a standard Clash config to `~/projects/clash-config.yaml` |
| `mihomo2clash check` | `mihomo2clash check --json` | Dry run; report what is kept / dropped / rewritten |

## Files

- Input: `~/cicy-ai/db/mihomo.yaml` (`MIHOMO_CONFIG` overrides)
- Output: `~/projects/clash-config.yaml` (`CICY_PROJECTS` overrides the directory), mode 0600

## Related

- `cicy-mihomo` — manages the source config and the running proxy
- `lanshare` — serve `~/projects` over HTTP to use the file as a remote Clash profile

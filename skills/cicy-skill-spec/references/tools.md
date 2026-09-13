# cicy-skill-spec — layout, env, related commands

## Install directory layout (decided by source)

```
~/cicy-ai/skills/
├── <name>/               PUBLIC  — skills.cicy-ai.com
├── private/<name>/       PRIVATE — your own local registry (localhost/127.0.0.1)
└── team/<team>/<name>/   TEAM    — another team's private registry
```

On Windows matrix machines the same skill dirs are pushed to `%USERPROFILE%\.agents\skills\<name>\` for dsh, with shims in `%USERPROFILE%\.agents\bin\`.

## Environment

| Var | Meaning |
|-----|---------|
| `CICY_SKILLS_ROOT` | Override `~/cicy-ai/skills` (where skills install) |
| `CICY_SKILLS_REGISTRY` | Single-source override (ignores registries.json) |
| `CICY_SKILLS_REGISTRY_TOKEN` | Bearer token for the override registry |
| `CICY_API_BASE` / `CICY_API_TOKEN` | Where a skill finds cicy-code (env first, then `~/cicy-ai/global.json`); set by the dsh launcher on Windows |

## Related cicy-code commands

| Command | Purpose |
|---------|---------|
| `cicy-code skill registry serve` | Host a private registry on this machine |
| `cicy-code skill registry publish <dir>` | Publish a skill dir into the local registry |
| `cicy-code skill registry add <url> --name <t> --token <tok>` | Add a team's registry as a client source |
| `cicy-code skill registry sources` | List configured sources |
| `cicy-code skill install <name>` / `<team>/<name>` | Install (lands per the layout above) |

## State files

| File | Holds |
|------|-------|
| `~/cicy-ai/registries.json` | Client source list (name/url/token), `0600` |
| `~/cicy-ai/local-registry.json` | Host config (enabled/port/dir/token), `0600` |
| `~/cicy-ai/skills/installed.json` | Installed records (incl. `install_dir`) |
| `~/cicy-registry-data/` | Default data dir for a hosted registry |

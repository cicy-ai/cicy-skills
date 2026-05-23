# cicy-ssh — help

## Commands

```
cicy-ssh list [--short] [--json]              List all Host entries
cicy-ssh show <alias> [--json]                Show one Host block (raw + parsed)
cicy-ssh add <alias> <hostname>               Append a minimal Host block
       [--user U] [--port N]
       [--identity FILE] [--jump HOST]
cicy-ssh resolve <alias> [--json]             ssh -G <alias>
cicy-ssh exec <alias> '<command>'             ssh <alias> '<command>' (non-interactive)
cicy-ssh --help / -h / help                   Print this help
```

For real interactive sessions:

```
ssh <alias>
ssh <alias> '<command>'
ssh -J <jump> <alias>
scp <alias>:/path ./local/
rsync -av ./local/ <alias>:/remote/
```

## Environment

- `CICY_SSH_CONFIG` — override config path (default `~/.ssh/config`)

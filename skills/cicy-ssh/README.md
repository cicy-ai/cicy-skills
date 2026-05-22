# cicy-ssh

> Source-only Node.js, 239 LOC. Read [`bin/cicy-ssh`](./bin/cicy-ssh).

Inspects and manages `~/.ssh/config` Host entries. Real connections use the
native `ssh` command — this wrapper does NOT proxy ssh.

## Install

```bash
cicy-code skill install cicy-ssh
```

## Quick usage

```bash
cicy-ssh list                     # all Host entries with hostname/user/port
cicy-ssh list --short             # alias names only
cicy-ssh show my-server           # raw block from config
cicy-ssh resolve my-server        # ssh -G my-server (effective config)
cicy-ssh add my-box 1.2.3.4 --user root --port 2222
cicy-ssh exec my-server 'uname -a'  # one-off non-interactive remote command

# For interactive sessions, use ssh directly:
ssh my-server
```

## License

MIT

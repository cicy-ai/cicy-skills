---
name: proxy_ssh
description: Manage autossh-based SOCKS5 proxy profiles on this host. list/show/create/delete, start/stop/restart, connectivity test. Each profile pins a local SOCKS port to an SSH target.
---

# Proxy SSH

Manage autossh-based SOCKS5 proxy profiles. Config stored at `~/cicy-ai/db/proxy_ssh.json`.

## Usage

```bash
proxy_ssh list
proxy_ssh show <name>
proxy_ssh create <name> --ssh-host HOST --ssh-port 22 --ssh-user USER --local-port 1080 [--identity ~/.ssh/id_rsa]
proxy_ssh delete <name>
proxy_ssh start <name>
proxy_ssh stop <name>
proxy_ssh restart <name>
proxy_ssh test <name>
proxy_ssh install-autossh
```

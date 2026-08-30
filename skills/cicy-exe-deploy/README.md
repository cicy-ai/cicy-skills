# CiCy Exe Deploy

Distribute a Windows installer (.exe) from a WSL/Docker cicy-code node to every sibling team's Windows PC via CiCy Hub ssh and install it through that team's cicy-desktop.

```
                 ┌──────────────── CiCy Hub (frp ssh ports) ────────────────┐
  this node ─────┤ ssh cicy@hub:20001 → team A container  ~/projects = C:\projects │
  (cicy-code     │ ssh cicy@hub:20002 → team B container  ~/projects = C:\projects │
   in WSL/Docker)│ …                                                        │
                 └──────────────────────────────────────────────────────────┘
                     each container:  curl <url> → ~/projects/X.exe   (= C:\projects\X.exe)
                     ssh -L → :8008 → agent-desktop exec-file install.bat → "C:\projects\X.exe" /S
```

## Install

```sh
cicy-code skill install cicy-exe-deploy
cicy-code skill install agent-desktop     # needed for the install step
```

## Use

```sh
cicy-exe-deploy nodes                                   # who is reachable
cicy-exe-deploy push <https://oss/…/app.exe> --nodes xs-1002   # pilot one PC
cicy-exe-deploy versions --nodes xs-1002                # confirm it came back on the new version
cicy-exe-deploy push <https://oss/…/app.exe> --exclude xs-1002 --parallel 2
cicy-exe-deploy versions
```

Pass a URL whenever you can: nodes download it themselves (OSS/CDN, >10 MB/s).
A local path is also accepted but is relayed over the hub (~10 KB/s).

See [references/help.md](references/help.md) and
[references/tools.md](references/tools.md).

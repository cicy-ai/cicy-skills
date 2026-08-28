---
name: redroid-matrix
description: Use when controlling the cicy-desktop Redroid 矩阵 panel: create/start/stop/remove redroid Android devices, screenshot, tap/swipe/key/text, proxy, IP grade, frida, apps, adb shell.
---

# Redroid Matrix

Drive the cicy-desktop **Redroid 矩阵** panel from an agent. The panel is a
`cicyui://panel/…?preset=redroid-matrix` tab in the host's profile-0 tab window; this
skill opens it, then calls the page's bridge API through CDP via the public
`agent-electron` / `agent-desktop` skills — so every button in the panel has a
command here, and every profile / device / webview can be addressed by id.

## Scope

Use this skill when the task mentions the Redroid 矩阵 panel, or needs to
manage what it manages (redroid Android devices in the host WSL docker).
Do not use it for the host's system Chrome (`agent-chrome`) or for generic
Electron windows (`agent-electron`).

## Quick start

```sh
redroid-matrix open
redroid-matrix defaults --json
redroid-matrix --help
```

## Commands

| command | example | does |
|---|---|---|
| `open` | `redroid-matrix open` | Open (or find) the Redroid 矩阵 panel tab; prints its webContentsId |
| `close` | `redroid-matrix close` | Close the panel tab |
| `defaults` | `redroid-matrix defaults --json` | Available images, default spec, proxy hint, frida-server path |
| `list` | `redroid-matrix list --json` | All devices with state, adb port, Android version, proxy, IP grade |
| `create` | `redroid-matrix create --name phone2 --version 13 --width 720 --height 1280 --dpi 320 --proxy 172.18.0.2:20011` | Create and boot a new device (docker run in WSL) |
| `start` | `redroid-matrix start phone2` | Start a stopped device |
| `stop` | `redroid-matrix stop phone2` | Stop a device |
| `restart` | `redroid-matrix restart phone2` | Restart a device |
| `remove` | `redroid-matrix remove phone2 --yes --purge` | Delete the container (needs --yes; --purge also deletes its data dir) |
| `screenshot` | `redroid-matrix screenshot phone2 --out shot.png` | PNG of the Android screen (adb screencap) |
| `tap` | `redroid-matrix tap phone2 360 640` | Tap at x,y |
| `swipe` | `redroid-matrix swipe phone2 360 1000 360 300 250` | Swipe x1,y1 → x2,y2 in ms |
| `key` | `redroid-matrix key phone2 HOME` | Key event by AOSP name or code (HOME, BACK, ENTER, 3 …) |
| `text` | `redroid-matrix text phone2 hello world` | Type ASCII text |
| `set-proxy` | `redroid-matrix set-proxy phone2 172.18.0.2:20012` | Device-wide proxy (empty string clears) |
| `probe-ip` | `redroid-matrix probe-ip phone2` | Egress IP, region and cleanliness grade A–D |
| `frida` | `redroid-matrix frida phone2 on` | Start/stop frida-server on the device |
| `apps` | `redroid-matrix apps phone2` | Installed packages |
| `launch` | `redroid-matrix launch phone2 org.telegram.messenger` | Launch an app by package |
| `uninstall` | `redroid-matrix uninstall phone2 org.telegram.messenger` | Uninstall a package |
| `install` | `redroid-matrix install phone2` | Pick APK/XAPK files via the host's native file dialog and install them |
| `shell` | `redroid-matrix shell phone2 getprop ro.build.version.release` | adb shell command |
| `panel-eval` | `redroid-matrix panel-eval "window.redroidAPI.list()"` | Run JS in the panel page itself |

## Notes

- Devices run as docker containers inside the host's WSL distro (`cicy-code-wsl`); the panel manages them over persistent WSL shell lanes + adb.
- Coordinates are in the device's own resolution (see `list` → info.size); `text` is ASCII-only (adb limitation).
- `install` opens a native file dialog on the host — someone at the machine must pick the file.
- Screenshots of Android devices are not the user's desktop, but still avoid them unless needed; `list`/`shell` are cheaper.
- Exit codes: 0 ok · 2 usage · 3 confirmation required (`--yes`) · 4 transport/page error.

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md) — command reference
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md) — transport and integration notes

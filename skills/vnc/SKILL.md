---
name: vnc
description: Run a VNC server on a headless Linux host: install x11vnc/Xvfb, start a display with a window manager and password, check status, grab screenshots.
---

# VNC Desktop Server

This skill (`vnc`) turns a headless Linux box into something you can look at:
it puts an **x11vnc** server on an X display — reusing one that already exists,
or creating it with **Xvfb** — and hands you a `vnc://host:port` to connect to.

## Scope

Use this skill when the task involves:

- installing a VNC stack on a server / container / Colab-style host
- starting a virtual desktop so a GUI app (Electron, Chrome, an installer) has
  somewhere to draw
- finding out **which displays exist** and whether anything is serving them
- taking a screenshot of a display to show the user what an app looks like
- stopping a VNC server, or tearing down the Xvfb behind it

Do **not** use it for: SSH tunnels alone (see `proxy_ssh`), browser automation
without a visible desktop (`agent-chrome` drives headless Chrome directly), or
anything on macOS/Windows — this is Linux + X11 only.

## Quick start

```sh
vnc install                # apt: x11vnc, xvfb, fluxbox, x11-utils, imagemagick
vnc start :1               # display + WM + password, prints the password once
vnc status                 # what is running where
vnc screenshot :1 --out ~/cicy-ai/assets/desktop.png
vnc stop :1
```

`vnc start` prints the generated password **once**. x11vnc stores it obfuscated
in `~/.vnc/passwd`; it cannot be read back, so a lost password means
`vnc password --set <new>` followed by `vnc restart :1`.

## How it behaves

**Display reuse.** `vnc start :1` first checks whether an X server already owns
`:1` (many container images start one at boot). If so it attaches to it and
does not start a second one — and `vnc stop --kill-x` will refuse to kill it,
because the skill only tears down an Xvfb it started itself.

**MIT-SHM.** x11vnc is always started with `-noshm`. When the X server belongs
to another user (root started it, you are not root), the shared-memory attach
fails with `BadAccess` and x11vnc dies seconds after launch. `-noshm` trades a
little throughput for actually working.

**Window manager.** A bare X display gives apps no decorations and no way to
move or resize windows. `vnc start` launches `fluxbox` when nothing else has
claimed the screen; pass `--wm none` to skip that.

**Ports.** The default RFB port is `5900 + display number`, so `:1` → `5901`.
Override with `--port`.

## Exposure

`--listen all` (the default) binds every interface, so anyone who can reach the
port and knows the password gets a full desktop session. On a public host use:

```sh
vnc start :1 --listen localhost
ssh -L 5901:127.0.0.1:5901 user@host    # from the client
```

`--nopw` disables authentication entirely. Only use it behind `--listen
localhost`, and say so plainly to whoever you set it up for.

## References

- [help.md](./references/help.md) — every command and flag
- [tools.md](./references/tools.md) — files, ports, troubleshooting

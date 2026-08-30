# vnc

Run a VNC server on a headless Linux host — install the stack, create or reuse
an X display, serve it with x11vnc, screenshot it.

```sh
vnc install                                   # x11vnc, xvfb, fluxbox, x11-utils, imagemagick
vnc start :1 --geometry 1920x1080             # prints the password once
vnc status
vnc screenshot :1 --out ~/cicy-ai/assets/desktop.png
vnc stop :1 --kill-x
```

- Reuses an X server that already owns the display instead of starting a second one.
- Always passes `-noshm`, so it survives an X server owned by root.
- Starts `fluxbox` only when no window manager has claimed the screen.
- Default port is `5900 + display number`.

For anything reachable from the internet, bind locally and tunnel:

```sh
vnc start :1 --listen localhost
ssh -L 5901:127.0.0.1:5901 user@host
```

State in `~/cicy-ai/db/vnc.json`, password in `~/.vnc/passwd`, logs in
`~/.vnc/logs/`.

See [SKILL.md](./SKILL.md), [references/help.md](./references/help.md) and
[references/tools.md](./references/tools.md).

MIT © cicy-ai

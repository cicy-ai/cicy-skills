# vnc — 命令参考

```
vnc <命令> [display] [选项]
```

display 可以按位置给出（`vnc start :1`、`vnc start 1`），也可以用
`--display :1`。默认取 `$VNC_DISPLAY`，再退回 `:1`。

## 命令

### `vnc install [--force]`

安装缺失的组件：`x11vnc`、`xvfb`、`fluxbox`、`x11-utils`（`xdpyinfo`、
`xprop`）、`imagemagick`（`import`）。使用 `apt-get`，需要 root 或免密
`sudo`。组件齐全时直接退出 0，不动 apt；`--force` 会重装全部。

### `vnc start [:N] [选项]`

1. 复用 `:N` 上已有的 X server，没有就启动 `Xvfb :N -screen 0 <geometry>x<depth>`。
2. 若没有窗口管理器占用屏幕，则启动一个。
3. 写入密码（未指定 `--password` / `--nopw` 时随机生成）。
4. 启动 `x11vnc -display :N -rfbport <port> -forever -shared -noshm -noxdamage`。

该 display 上已有 x11vnc 时会报错退出 —— `--force` 替换掉它，通常你想要的是
`vnc restart`。

| 选项 | 默认 | 含义 |
|------|------|------|
| `--port <n>` | `5900 + N` | RFB 端口 |
| `--geometry <WxH>` | `1440x900` | **新建** Xvfb 时的分辨率 |
| `--depth <n>` | `24` | 新建 Xvfb 的色深 |
| `--listen all\|localhost` | `all` | 监听全部网卡，或仅 `127.0.0.1` |
| `--wm fluxbox\|none` | `fluxbox` | 无 WM 时启动哪个窗口管理器 |
| `--password <pw>` | — | 使用指定密码 |
| `--random-password` | — | 即使已有密码也重新生成 |
| `--nopw` | — | 完全不鉴权 |
| `--force` | — | 替换该 display 上已在运行的 x11vnc |

生成的密码**只打印这一次** —— 它以混淆形式存储，无法再读回来。

### `vnc stop [:N] | --all [--kill-x]`

向服务该 display 的 x11vnc 发 `SIGTERM`，并从状态文件中移除。`--kill-x` 同时
停掉 X server，但**仅限本 skill 自己启动的那个** —— 系统或原本就存在的 X
server 不会被动。`--all` 停掉找到的所有 VNC 服务，无论是否本 skill 启动。

### `vnc restart [:N]`

先停后起，沿用记录的端口和 `--listen`，除非你显式覆盖。

### `vnc status [:N] [--json]`

状态文件或 `/tmp/.X11-unix` 中发现的每个 display 一行：

```
DISPLAY  X   GEOMETRY    WM        VNC  PORT   LISTEN     PID
:1       up  1440x900    fluxbox   up   5901   all        43801
```

`--json` 返回 `{ ok, displays: [{ display, x_server, geometry, wm, vnc, pid,
port, listen, auth, log }] }`。

### `vnc password [--set <pw>] [--show]`

通过 `x11vnc -storepasswd` 写入 `~/.vnc/passwd`（权限 0600）。不带 `--set` 时
随机生成 8 位密码并打印。`--show` 只报告文件是否存在 —— 存储的是混淆数据，读
不出明文。

VNC 的 DES 鉴权**只用密码前 8 个字符**，更长的部分会被静默截断，设置时 skill
会提示。

改密码后需要 `vnc restart :N` 才会生效。

### `vnc screenshot [:N] [--out <path>]`

用 ImageMagick `import` 抓取根窗口，没有则退回 `ffmpeg -f x11grab`。默认输出
`./vnc-<N>-<时间戳>.png`。若抓出空文件会报错。

### `vnc logs [:N] [-n <行数>]`

查看 `~/.vnc/logs/x11vnc<N>.log` 末尾（默认 40 行）。

## 全局选项

| 选项 | 含义 |
|------|------|
| `--json` | 所有命令输出机器可读 JSON |
| `--help`、`-h`、`help` | 显示帮助 |

## 退出码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 1 | 运行失败（服务没起来、display 不存在、安装失败） |
| 2 | 未知命令 |

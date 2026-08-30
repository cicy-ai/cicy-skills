# vnc — 文件、端口与排错

## 文件

| 路径 | 内容 |
|------|------|
| `~/cicy-ai/db/vnc.json` | 状态：每个 display 的端口、分辨率、WM、pid、日志，以及 X server 是否由本 skill 启动。权限 0600。 |
| `~/.vnc/passwd` | 密码，由 `x11vnc -storepasswd` 混淆存储。权限 0600。 |
| `~/.vnc/logs/x11vnc<N>.log` | display `:N` 的 x11vnc 日志 |
| `~/.vnc/logs/Xvfb<N>.log` | 本 skill 启动 Xvfb 时的日志 |
| `~/.vnc/logs/fluxbox<N>.log` | 窗口管理器日志 |
| `/tmp/.X11-unix/X<N>` | X server socket —— `status` 据此发现 display |

用 `VNC_STATE` 覆盖状态文件路径，用 `VNC_DISPLAY` 覆盖默认 display。

## 端口

| Display | 默认 RFB 端口 |
|---------|---------------|
| `:0` | 5900 |
| `:1` | 5901 |
| `:2` | 5902 |

x11vnc 同时会开对应的 IPv6 socket。注意即使指定了 `-rfbport 5901`，它探测端口
时仍会在 **IPv6 的 5900** 上监听 —— 无害，但 `ss -ltn` 里能看到。

## 依赖的可执行文件

| 程序 | 包 | 用途 |
|------|-----|------|
| `x11vnc` | x11vnc | VNC 服务本体 |
| `Xvfb` | xvfb | 创建不存在的 display |
| `fluxbox` | fluxbox | 窗口装饰、移动/缩放 |
| `xdpyinfo`、`xprop` | x11-utils | 存活检测、分辨率、WM 检测 |
| `import` | imagemagick | 截图（退路是 `ffmpeg`） |
| `setsid` | util-linux | 让 Xvfb / WM 脱离当前进程 |

## 排错

**x11vnc 启动一秒就退出，日志里是 `X11 MIT Shared Memory Attach failed` /
`BadAccess`。** X server 属于另一个用户（通常是 root 在开机时起的）。本 skill
一律带 `-noshm` 规避；如果你手工跑 x11vnc，也要加 `-noshm`。

**`another window manager already running`。** 屏幕已被别的 WM（比如 XFCE）
占用。无害 —— `vnc start` 检测到已有 WM 就会跳过 fluxbox。用 `--wm none` 可以
彻底不尝试。

**客户端连上了但一片黑。** display 起来了，只是没有程序在上面画东西。用
`DISPLAY=:1 <程序> &` 启动一个，或确认你的程序确实拿到了 `DISPLAY` 环境变量。

**`vnc status` 显示 `X up` 但 `VNC -`。** display 存在但没有服务挂上去，执行
`vnc start :N`。

**别的机器连不上（Connection refused）。** 要么启动时用了 `--listen
localhost`，要么被防火墙挡了。更推荐保持只监听 localhost，然后用
`ssh -L 5901:127.0.0.1:5901 user@host` 转发。

**改了密码不生效。** x11vnc 只在启动时读 `~/.vnc/passwd` —— `vnc password`
之后要 `vnc restart :N`。

## 安全

`--listen all` 加一个密码，等于把完整桌面暴露在网络上，谁猜中那被 DES 截断的
8 个字符谁就进来了。公网可达的主机请用 `--listen localhost` + SSH 隧道。
`--nopw` 是完全无鉴权的活桌面（含会话和剪贴板）—— 只能配合 localhost 使用。

## 相关 skill

- `agent-chrome` —— 在桌面主机上驱动 Chrome（需要 display，本 skill 提供）
- `agent-desktop` / `agent-electron` —— 控制 cicy-desktop Electron 客户端
- `proxy_ssh` —— SOCKS5 隧道，适合转发端口而不是直接暴露

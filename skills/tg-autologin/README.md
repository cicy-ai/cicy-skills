# tg-autologin (private)

Telegram Web auto-login for cicy-desktop Telegram 矩阵 profiles: send phone →
overlay a same-size 接码 webview above the cell to read the code + 2FA → type
them → login. Drives the machine main process over the wsd control socket;
cooldowns are CLI-side to respect the getcode ~1/min limit. Zero deps, Node 18+.

```sh
tg-autologin login xs-1004 4
tg-autologin login xs-1004 2,3,4
```

# redroid-matrix — 帮助

## 命令

```
  redroid-matrix open
  redroid-matrix close
  redroid-matrix defaults --json
  redroid-matrix list --json
  redroid-matrix create --name phone2 --version 13 --width 720 --height 1280 --dpi 320 --proxy 172.18.0.2:20011
  redroid-matrix start phone2
  redroid-matrix stop phone2
  redroid-matrix restart phone2
  redroid-matrix remove phone2 --yes --purge
  redroid-matrix screenshot phone2 --out shot.png
  redroid-matrix tap phone2 360 640
  redroid-matrix swipe phone2 360 1000 360 300 250
  redroid-matrix key phone2 HOME
  redroid-matrix text phone2 hello world
  redroid-matrix set-proxy phone2 172.18.0.2:20012
  redroid-matrix probe-ip phone2
  redroid-matrix frida phone2 on
  redroid-matrix apps phone2
  redroid-matrix launch phone2 org.telegram.messenger
  redroid-matrix uninstall phone2 org.telegram.messenger
  redroid-matrix install phone2
  redroid-matrix shell phone2 getprop ro.build.version.release
  redroid-matrix panel-eval "window.redroidAPI.list()"

  redroid-matrix --client <client_id> ...   指定 cicy-desktop 客户端（连着多台时）
  redroid-matrix --json                      机器可读输出
  redroid-matrix --help
```

## 说明

- 设备是宿主 WSL 发行版（`cicy-code-wsl`）里的 docker 容器，面板通过常驻 WSL shell 通道 + adb 管理。
- 坐标使用设备自身分辨率（`list` → info.size）；`text` 只支持 ASCII（adb 限制）。
- `install` 会在宿主机弹出原生文件选择框，需要有人在机器前选择文件。
- 退出码：0 成功 · 2 用法错误 · 3 需要 `--yes` 确认 · 4 传输/页面错误。

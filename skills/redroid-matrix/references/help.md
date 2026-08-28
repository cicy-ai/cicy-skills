# redroid-matrix — help

## Commands

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

  redroid-matrix --client <client_id> ...
  redroid-matrix --json
  redroid-matrix --help
```

## Notes

- Devices run as docker containers inside the host's WSL distro (`cicy-code-wsl`); the panel manages them over persistent WSL shell lanes + adb.
- Coordinates are in the device's own resolution (see `list` → info.size); `text` is ASCII-only (adb limitation).
- `install` opens a native file dialog on the host — someone at the machine must pick the file.
- Screenshots of Android devices are not the user's desktop, but still avoid them unless needed; `list`/`shell` are cheaper.
- Exit codes: 0 ok · 2 usage · 3 confirmation required (`--yes`) · 4 transport/page error.

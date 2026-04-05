# Chrome Debugger

Google Chrome 远程调试服务，提供 CDP (Chrome DevTools Protocol) 接口。

## 服务信息

- **调试端口:** 9220 (默认，可通过 `DEBUG_PORT` 修改)
- **用户:** w3c_offical
- **启动脚本:** ~/tools/chrome.sh
- **数据目录:** ~/data/browser/chrome
- **DISPLAY:** :1 (VNC)

## 通过 xui 管理（推荐）

```bash
xui 1 chrome profiles                      # 列出所有 profile
xui 1 chrome start                         # 启动 (默认 profile)
xui 1 chrome start --profile=Default       # 指定 profile
xui 1 chrome start --profile="Profile 1"   # 指定 profile
xui 1 chrome start --proxy=socks5://x      # 带代理
xui 1 chrome start --debug-port=9222       # 自定义调试端口
xui 1 chrome stop
xui 1 chrome restart
```

## 直接使用 chrome.sh

```bash
bash ~/tools/chrome.sh start               # 启动
bash ~/tools/chrome.sh start -p            # 带代理启动
bash ~/tools/chrome.sh stop                # 停止
bash ~/tools/chrome.sh status              # 查看状态
bash ~/tools/chrome.sh install             # 首次安装 Chrome
DEBUG_PORT=9222 bash ~/tools/chrome.sh start  # 自定义端口
CHROME_PROFILE="Profile 1" bash ~/tools/chrome.sh start  # 指定 profile
```

## 远程调试 API

```bash
curl http://localhost:9220/json/version     # 版本信息
curl http://localhost:9220/json             # 打开的标签页
curl http://localhost:9220/json/new?url=https://google.com  # 新建标签页
```

## 故障排查

```bash
cat ~/data/browser/chrome/chrome.log        # 查看日志
ss -tlnp | grep 9220                       # 检查端口
ps aux | grep chrome | grep 9220           # 检查进程
```

## 依赖

- VNC Server (DISPLAY :1)
- xui 服务 (可选，用于 CLI 管理)

## 相关

- `~/skills/xui.md` - xui 桌面控制代理
- `~/skills/vnc-server.md` - VNC 服务器
- `~/skills/cdp.md` - CDP 协议工具

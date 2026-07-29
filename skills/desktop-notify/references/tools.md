# 依赖与实现

- 传输依赖 **agent-desktop skill**(`agent-desktop rpc ...`),需已安装并有桌面客户端连接。
- 桌面侧实现:cicy-desktop `src/tools/notify-tools.js`(主进程 Electron Notification,
  tag=System),经 `src/tools/index.js` 注册;tool-executor 每次调用热加载,新增文件免重启。
- Windows AppUserModelId:`src/main.js` `setAppUserModelId("com.cicy.desktop")`。
- 回退路径:`exec_js` 在窗口 1 里跑网页 `new Notification(...)`(Electron 默认放行,无需授权)。

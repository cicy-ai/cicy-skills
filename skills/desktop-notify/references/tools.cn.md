# 依赖与实现

- 依赖 `agent-desktop` CLI 和已连接的 CiCy Desktop 客户端。
- 通过 `agent-desktop rpc` 调用 `notify` RPC。
- 桌面端使用 Electron 主进程的 `Notification` 实现原生通知。
- macOS 显示通知中心横幅，Windows 显示 toast。
- Windows AppUserModelId 为 `com.cicy.desktop`。
- 旧版客户端自动回退 `exec_js` 和浏览器 `Notification` API。

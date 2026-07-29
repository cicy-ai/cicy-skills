# Dependencies and implementation

- Requires the `agent-desktop` CLI and a connected CiCy Desktop client.
- Sends the `notify` RPC through `agent-desktop rpc`.
- The desktop implements native notifications with Electron's main-process `Notification`.
- macOS displays Notification Center banners; Windows displays toast notifications.
- Windows uses AppUserModelId `com.cicy.desktop`.
- Older clients fall back to `exec_js` and the browser `Notification` API.

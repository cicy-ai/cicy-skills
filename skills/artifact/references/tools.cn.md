# artifact — 工具

每条命令都是一次 `exec_js` 往返：在 cicy-code 页面（宿主）中执行一段 JavaScript。
`exec` 直接寻址产物 `<webview>` 元素并调用 `executeJavaScript` —— **代码运行在 webview 内部的访客页中**，而非宿主页；其余命令则通过 `window.cicyArtifact.*` 进行。

## 命令总表（含具体说明）

| 命令 | 功能 | 备注 |
|---|---|---|
| `open <url>` | 打开右侧栏 + 激活产物 tab + 加载 url | 用户立即可见；这是入口 |
| `load <url>` / `set-url` | 仅加载 url，不抢夺 tab | 后台换页 |
| `geturl` / `url` | 返回访客页当前 URL | |
| `reload` | 重载产物帧 | |
| `clear` | 置空（about:blank） | |
| `info` | `{mounted, electron, url, hasBridge, hasCdp, preview, bufferedEvents}` | 先运行此命令查看环境 |
| `list-tools` / `list_tools` | **动态枚举**当前帧可用的全部 Electron 能力：webview 元素方法（附中文说明）+ webContentsId + bridge 可用性 | `--json` 输出结构化数据 |
| `exec '<js>'` | **在 webview 访客页内**执行 JS，返回结果 | 异步操作自动 await；原生 alert/confirm 会被 webview 吞掉，如需可见效果请注入 DOM |
| `call <m> [jsonArg…]` | 调用 webview **元素方法**（参见 list-tools 中的 67 个） | 例如 `call setZoomFactor 1.5`、`call insertCSS 'body{...}'` |
| `invoke <m> [jsonArg…]` | 强制走主进程 webContents 路径 | 需要 desktop bridge（`window.cicy.artifact`） |
| `cdp-attach [v]` | 挂接 CDP 调试器（会自动关闭手动打开的 DevTools） | 需要 bridge |
| `cdp <Domain.method> ['{params}']` | 全量 CDP：DOM/Network/Runtime/Input/Page/Emulation… | 需要 bridge；需先 `cdp-attach` |
| `cdp-detach` | 卸载调试器 | |
| `capture [out.png]` | 像素截图；指定路径则保存为 PNG，否则返回 dataURL | 通过元素 `capturePage`。⚠️ **base64 消耗大量 token，截图前请先询问用户**；读取页面内容请用 `snapshot` |
| `pdf [out.pdf]` | 渲染 PDF；指定路径则保存 | 通过元素 `printToPDF` |
| `events [max]` / `peek [max]` | 获取 / 预览页面缓冲的事件（console、导航、CDP 流） | exec_js 是请求-响应式，事件只能拉取 |
| `clear-events` | 清空事件缓冲 | |
| `clients` | 列出已连接的 cicy-code 页面客户端 | 多客户端时需配合 `--client <id>` 使用 |

## 元素方法速查（`artifact call <m>`，完整 67 个请运行 `list-tools`）

- **导航**: `loadURL` `getURL` `getTitle` `reload` `reloadIgnoringCache` `stop` `goBack` `goForward` `goToIndex` `clearHistory` …
- **执行/注入**: `executeJavaScript` `insertCSS`/`removeInsertedCSS` `insertText`
- **捕获**: `capturePage`（=capture） `printToPDF`（=pdf） `print`
- **输入合成**: `sendInputEvent`（mouseDown/mouseUp/char/keyDown/mouseWheel…）
- **编辑**: `copy` `paste` `cut` `selectAll` `undo` `redo` `replace` …
- **查找/滚动**: `findInPage`/`stopFindInPage` `scrollToTop`/`scrollToBottom`
- **DevTools**: `openDevTools` `closeDevTools` `inspectElement` …
- **缩放**: `setZoomFactor`/`getZoomFactor` `setZoomLevel`/`getZoomLevel`
- **状态**: `isLoading` `isCrashed` `getWebContentsId` `focus`
- **音频**: `setAudioMuted` `isAudioMuted` `isCurrentlyAudible`
- **IPC**: `send`/`sendToFrame`（需要 guest preload）· `setUserAgent`/`getUserAgent`

## 注意事项

- `webContentsId` 在每次产物帧重载时都会变化，定位帧应使用选择器而非固定 ID。
- 旧版 cicy-desktop 未注入 `window.cicy` → `invoke`/`cdp` 不可用，
  但元素级方法（上表所列全部）仍可正常工作。
- 大型结果（截图/PDF base64）通过 chat-WS 回传，服务端读取限制为 8MB。

## 示例

```bash
artifact open https://example.com        # 打开右栏+产物tab并加载
artifact info                            # 查看环境信息
artifact list-tools                      # 列出当前帧全部可用能力
artifact exec 'document.title'           # 在访客页内取值
artifact exec '(()=>{const d=document.createElement("div");d.textContent="hi";document.body.appendChild(d);return "ok"})()'
artifact call setZoomFactor 1.25         # 元素方法调用
artifact call sendInputEvent '{"type":"mouseDown","x":100,"y":200,"button":"left","clickCount":1}'
artifact capture /tmp/shot.png           # 截图保存到文件
artifact events 50                       # 拉取事件
```

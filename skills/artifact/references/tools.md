# artifact — tools

每条命令都是一次 `exec_js` round-trip:在 cicy-code 页面(host)里执行一段 JS。
`exec` 直接寻址产物 `<webview>` 元素并调 `executeJavaScript` —— **代码跑在
webview 内部的 guest 页里**,不是 host 页;其余命令经 `window.cicyArtifact.*`。

## 命令总表(含具体说明)

| 命令 | 做什么 | 备注 |
|---|---|---|
| `open <url>` | 打开右侧栏 + 激活产物 tab + 加载 url | 用户立刻可见;这是入口 |
| `load <url>` / `set-url` | 仅加载 url,不抢 tab | 后台换页 |
| `geturl` / `url` | 返回 guest 当前 URL | |
| `reload` | 重载产物帧 | |
| `clear` | 置空(about:blank) | |
| `info` | `{mounted, electron, url, hasBridge, hasCdp, preview, bufferedEvents}` | 先跑这个看环境 |
| `list-tools` / `list_tools` | **动态枚举**当前帧可用的全部 Electron 能力:webview 元素方法(中文说明)+ webContentsId + bridge 可用性 | `--json` 给结构化 |
| `exec '<js>'` | **在 webview guest 页内**执行 JS,返回结果 | async 自动 await;原生 alert/confirm 会被 webview 吞掉,要可见效果请注入 DOM |
| `call <m> [jsonArg…]` | 调 webview **元素方法**(见 list-tools 的 67 个) | 如 `call setZoomFactor 1.5`、`call insertCSS 'body{...}'` |
| `invoke <m> [jsonArg…]` | 强制走主进程 webContents 路径 | 需要 desktop bridge(`window.cicy.artifact`) |
| `cdp-attach [v]` | 挂 CDP debugger(会自动关掉手开的 DevTools) | 需要 bridge |
| `cdp <Domain.method> ['{params}']` | 全量 CDP:DOM/Network/Runtime/Input/Page/Emulation… | 需要 bridge;先 `cdp-attach` |
| `cdp-detach` | 卸下 debugger | |
| `capture [out.png]` | 截图;给路径则落盘 PNG,否则回 dataURL | 走元素 `capturePage` |
| `pdf [out.pdf]` | 渲染 PDF;给路径则落盘 | 走元素 `printToPDF` |
| `events [max]` / `peek [max]` | 取走 / 偷看页面缓冲的事件(console、导航、CDP 流) | exec_js 是请求响应式,事件只能拉 |
| `clear-events` | 清空事件缓冲 | |
| `clients` | 列出已连接的 cicy-code 页面客户端 | 多客户端时配 `--client <id>` |

## 元素方法速查(`artifact call <m>`,完整 67 个跑 `list-tools`)

- **导航**: `loadURL` `getURL` `getTitle` `reload` `reloadIgnoringCache` `stop` `goBack` `goForward` `goToIndex` `clearHistory` …
- **执行/注入**: `executeJavaScript` `insertCSS`/`removeInsertedCSS` `insertText`
- **捕获**: `capturePage`(=capture) `printToPDF`(=pdf) `print`
- **输入合成**: `sendInputEvent`(mouseDown/mouseUp/char/keyDown/mouseWheel…)
- **编辑**: `copy` `paste` `cut` `selectAll` `undo` `redo` `replace` …
- **查找/滚动**: `findInPage`/`stopFindInPage` `scrollToTop`/`scrollToBottom`
- **DevTools**: `openDevTools` `closeDevTools` `inspectElement` …
- **缩放**: `setZoomFactor`/`getZoomFactor` `setZoomLevel`/`getZoomLevel`
- **状态**: `isLoading` `isCrashed` `getWebContentsId` `focus`
- **音频**: `setAudioMuted` `isAudioMuted` `isCurrentlyAudible`
- **IPC**: `send`/`sendToFrame`(需 guest preload)· `setUserAgent`/`getUserAgent`

## 注意事项

- `webContentsId` 每次产物帧重载都会变,定位帧用选择器而不是死记 id。
- 老版 cicy-desktop 未注入 `window.cicy` → `invoke`/`cdp` 不可用,
  但元素级方法(上表全部)照常工作。
- 大结果(截图/PDF base64)经 chat-WS 回传,服务端读限 8MB。

## Examples

```bash
artifact open https://example.com        # 打开右栏+产物tab并加载
artifact info                            # 看环境
artifact list-tools                      # 列出当前帧全部可用能力
artifact exec 'document.title'           # guest 页内取值
artifact exec '(()=>{const d=document.createElement("div");d.textContent="hi";document.body.appendChild(d);return "ok"})()'
artifact call setZoomFactor 1.25         # 元素方法
artifact call sendInputEvent '{"type":"mouseDown","x":100,"y":200,"button":"left","clickCount":1}'
artifact capture /tmp/shot.png           # 截图落盘
artifact events 50                       # 拉事件
```

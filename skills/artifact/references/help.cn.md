# artifact — 帮助文档

通过聊天 WebSocket 的 exec_js 频道，使用 `window.cicyArtifact.*` 来远程控制 cicy-code **产物 (Artifact)** 标签页的页面框架。

```
artifact <command> [...args] [--client <id>] [--json]
```

全局参数：
- `--client <id>`  指定特定的 cicy-code 页面客户端（参见 `artifact clients`）。
- `--json`         输出 `{ ok, data }` / `{ ok, error }` 格式的 JSON。

认证：使用来自 `~/cicy-ai/global.json`（或环境变量 `$CICY_API_TOKEN`）的 `api_token`。
守护进程地址：`http://127.0.0.1:8008`（可通过环境变量 `$CICY_API_PORT` 覆盖）。

## 导航
- `artifact open <url>`       — 打开右侧栏 + 激活产物标签页 + 加载 `<url>`（用户立即可见）。
- `artifact load <url>`       — 加载 `<url>` 但不强制激活标签页（别名：`set-url`）。
- `artifact geturl`           — 获取当前 URL（别名：`url`）。
- `artifact reload`           — 重新加载框架。
- `artifact clear`            — 清空框架（about:blank）。
- `artifact info`             — 输出 `{ mounted, electron, url, hasBridge, hasCdp, bufferedEvents }` 信息。

## 内部页面 JS
- `artifact list-tools`       — 动态列出当前产物框架可用的所有 Electron 功能（包含 webview 元素方法及中文说明、webContentsId、bridge/CDP 可用性；使用 `--json` 获取结构化输出）。
- `artifact snapshot`         — DOM 快照（机器可读，包含点击区域坐标）：url/标题/可见可点击元素/输入框。**用于读取页面、定位点击，不消耗 token**。
- `artifact preview [web|portal|mobile]` — 产物预览视口：web=填满宿主 / portal=768x1024 平板竖屏 / mobile=390x844 手机；无参数则读取当前设置。
- `artifact exec '<js>'`      — 在 **webview 客户页面内**执行 JS（直接调用 `webview.executeJavaScript`），返回结果。
                                （别名：`exec-js`；异步表达式会等待完成。）

## 原生 webview / webContents（仅 Electron）
- `artifact call <method> [jsonArg ...]`
      调用原生方法，优先尝试原生元素方法。例如：
      `artifact call insertCSS 'body{filter:invert(1)}'`
      `artifact call setZoomFactor 1.5`
- `artifact invoke <method> [jsonArg ...]`
      强制使用主进程 webContents 路径（用于 cicy-desktop 拥有的方法）。

## CDP — Chrome 开发者工具协议（仅 Electron）
- `artifact cdp-attach [version]`   — 附加调试器（自动关闭 DevTools）。
- `artifact cdp-detach`             — 分离调试器。
- `artifact cdp <Domain.method> ['{json params}']`
      例如：`artifact cdp Runtime.evaluate '{"expression":"location.href"}'`
           `artifact cdp Input.dispatchMouseEvent '{"type":"mousePressed","x":10,"y":20,"button":"left","clickCount":1}'`
           `artifact cdp Network.enable`

## 鼠标/键盘
- 通过 CDP `Input.dispatchMouseEvent` / `Input.dispatchKeyEvent`（如上），或
- `artifact call sendInputEvent '{"type":"mouseDown","x":10,"y":20,"button":"left","clickCount":1}'`

## 捕获
- `artifact capture [out.png]`  — 截图；输出 data URL，如果提供路径则写入 PNG 文件。⚠️ 像素图（base64）会消耗大量 token，截图前请先询问用户；优先使用 `snapshot`。
- `artifact pdf [out.pdf]`      — 打印为 PDF；输出 base64，如果提供路径则写入 PDF 文件。

## 日志/事件（拉取式）
- `artifact events [max]`       — 排空（消费）缓冲的控制台 / 导航 / CDP 事件。
- `artifact peek [max]`         — 查看但不消费缓冲事件。
- `artifact clear-events`       — 清空缓冲区。

## 目标指定
- `artifact clients`            — 列出已连接的聊天客户端（用于选择 `--client`）。

## 退出代码
- `2` 用法错误 / 目标不明确 · `3` 不可达 / 未连接 / 认证失败 · `4` 页面侧或 API 错误。

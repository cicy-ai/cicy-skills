# artifact — help

Remote-control the cicy-code **产物 (Artifact)** tab's page frame via
`window.cicyArtifact.*` over the chat-WS exec_js channel.

```
artifact <command> [...args] [--client <id>] [--json]
```

Global flags:
- `--client <id>`  target a specific cicy-code page client (see `artifact clients`).
- `--json`         emit `{ ok, data }` / `{ ok, error }` JSON.

Auth: `api_token` from `~/cicy-ai/global.json` (or `$CICY_API_TOKEN`).
Daemon: `http://127.0.0.1:8008` (override with `$CICY_API_PORT`).

## Navigation
- `artifact open <url>`       — 打开右侧栏 + 激活产物 tab + 加载 `<url>`（用户立刻可见）.
- `artifact load <url>`       — load `<url>` without forcing the tab active (alias: `set-url`).
- `artifact geturl`           — current URL (alias: `url`).
- `artifact reload`           — reload the frame.
- `artifact clear`            — blank the frame (about:blank).
- `artifact info`             — `{ mounted, electron, url, hasBridge, hasCdp, bufferedEvents }`.

## Inner-page JS
- `artifact list-tools`       — 动态列出当前产物帧可用的全部 Electron 能力（webview 元素方法+中文说明、webContentsId、bridge/CDP 可用性；`--json` 给结构化）.
- `artifact exec '<js>'`      — 在 **webview guest 页内**执行 JS（直接走 `webview.executeJavaScript`），返回结果.
                                (alias: `exec-js`; async expressions are awaited.)

## Native webview / webContents (Electron only)
- `artifact call <method> [jsonArg ...]`
      Call a native method, native-element-first. e.g.
      `artifact call insertCSS 'body{filter:invert(1)}'`
      `artifact call setZoomFactor 1.5`
- `artifact invoke <method> [jsonArg ...]`
      Force the main-process webContents path (for methods cicy-desktop owns).

## CDP — Chrome DevTools Protocol (Electron only)
- `artifact cdp-attach [version]`   — attach the debugger (auto-closes DevTools).
- `artifact cdp-detach`             — detach.
- `artifact cdp <Domain.method> ['{json params}']`
      e.g. `artifact cdp Runtime.evaluate '{"expression":"location.href"}'`
           `artifact cdp Input.dispatchMouseEvent '{"type":"mousePressed","x":10,"y":20,"button":"left","clickCount":1}'`
           `artifact cdp Network.enable`

## Mouse / keyboard
- via CDP `Input.dispatchMouseEvent` / `Input.dispatchKeyEvent` (above), or
- `artifact call sendInputEvent '{"type":"mouseDown","x":10,"y":20,"button":"left","clickCount":1}'`

## Capture
- `artifact capture [out.png]`  — screenshot; prints a data URL, or writes a PNG if a path is given.
- `artifact pdf [out.pdf]`      — print to PDF; prints base64, or writes a PDF if a path is given.

## Logs / events (pull-based)
- `artifact events [max]`       — drain (consume) buffered console / navigation / CDP events.
- `artifact peek [max]`         — peek without consuming.
- `artifact clear-events`       — empty the buffer.

## Targeting
- `artifact clients`            — list connected chat clients (to pick `--client`).

## Exit codes
- `2` usage / ambiguous target · `3` not reachable / not connected / auth · `4` page-side or API error.

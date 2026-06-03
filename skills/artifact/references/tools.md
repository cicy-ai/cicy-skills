# artifact — tools

Each command runs one `exec_js` round-trip that calls `window.cicyArtifact.<fn>`
on the live cicy-code page.

| command | window.cicyArtifact call | notes |
|---|---|---|
| `open <url>` | `open(url)` | activate tab + load |
| `load <url>` / `set-url <url>` | `setUrl(url)` | load only |
| `geturl` / `url` | `getUrl()` | |
| `reload` | `reload()` | |
| `clear` | `clear()` | about:blank |
| `info` | `info()` | mounted/electron/url/hasBridge/hasCdp/bufferedEvents |
| `exec '<js>'` | `execJs(code)` | runs in the inner page; awaits promises |
| `call <m> [jsonArg…]` | `call(m, …args)` | native element method first, else webContents |
| `invoke <m> [jsonArg…]` | `invoke(m, args)` | forces main-process webContents path |
| `cdp-attach [v]` | `cdpAttach(v?)` | attach debugger |
| `cdp-detach` | `cdpDetach()` | |
| `cdp <M> ['{params}']` | `cdp(method, params)` | full CDP passthrough |
| `capture [out.png]` | `capture()` | returns dataURL; writes PNG if path given |
| `pdf [out.pdf]` | `pdf({})` | returns base64; writes PDF if path given |
| `events [max]` | `drainEvents(max?)` | consume buffered events |
| `peek [max]` | `peekEvents(max?)` | non-destructive |
| `clear-events` | `clearEvents()` | |
| `clients` | — | `GET /api/chat/clients` |

## Examples

```bash
# Show a live result to the user, then drive it
artifact open http://localhost:5173
artifact exec 'document.querySelectorAll("button").length'
artifact call insertCSS 'body{outline:2px solid red}'

# Full CDP automation
artifact cdp-attach
artifact cdp Network.enable
artifact cdp Page.navigate '{"url":"https://example.com"}'
artifact cdp Runtime.evaluate '{"expression":"document.title","returnByValue":true}'
artifact cdp Input.dispatchMouseEvent '{"type":"mousePressed","x":120,"y":48,"button":"left","clickCount":1}'

# Capture + logs
artifact capture /tmp/artifact.png
artifact events 50
```

## Layers

- **`exec`** runs *inside* the artifact page (DOM of the loaded URL).
- **`call` / `invoke`** operate *on* the `<webview>` / its `webContents`.
- **`cdp`** is the lowest level — DOM, Network, Runtime, Input, Page, Console.

# artifact

Open and fully remote-control the cicy-code **产物 (Artifact)** tab's page frame.

In cicy-desktop the artifact frame is a native Electron `<webview>`, so the
agent gets DevTools-grade control: navigate, run JS in the inner page, call any
native `<webview>`/`webContents` method, drive the full Chrome DevTools Protocol
(CDP), synthesize mouse/keyboard input, capture screenshots and PDFs, and read
the console/CDP event log. In a plain browser the frame is an `<iframe>` and
only navigation works.

It talks to the live cicy-code UI over the chat WebSocket (`POST
/api/chat/push`, `wait_ack`) by calling the page-global `window.cicyArtifact.*`
API — the same transport `agent-webpage` uses.

```bash
artifact open https://example.com
artifact exec 'document.title'
artifact cdp-attach
artifact cdp Page.captureScreenshot '{}'
artifact capture /tmp/shot.png
```

See `artifact help` and `references/tools.md`.

## How it fits together

```
agent → artifact CLI
      → POST /api/chat/push {type:exec_js, code:"window.cicyArtifact.open(...)"}
      → cicy-code page (Workspace exec_js handler → window.eval)
      → window.cicyArtifact  (app/src/lib/artifactBridge.ts)
          ├─ native <webview> element methods (loadURL/reload/executeJavaScript/...)
          └─ window.cicy.artifact.{invoke,cdp}  ← cicy-desktop preload (CDP + sendInputEvent)
      → the 产物 tab's <webview> (the result the user sees)
```

Requires Node 22+. Auth via `api_token` in `~/cicy-ai/global.json` or
`$CICY_API_TOKEN`.

# agent-mobile — wire protocol & command → tool mapping

## Transport

Identical to `agent-desktop`. Each command shells out **on the desktop machine**
through one RPC:

```
POST http://127.0.0.1:8008/api/chat/push
Authorization: Bearer <api_token from ~/cicy-ai/global.json>
{
  "client_id": "<resolved cicy-desktop client>",
  "type": "desktop_event",
  "wait_ack": true,
  "timeout_ms": 45000,
  "data": { "type": "rpc_call", "tool": "exec_shell", "args": { "command": "<adb/idevice…>" }, "requestId": "mrpc-…" }
}
```

The server's sync mode forwards to the connected client, runs the command, and
returns `{ data: { result } }`. `exec_shell` returns `{ stdout, stderr, exitCode }`.
Client resolution: explicit `--client <id>`, else the single client whose UA marks
it a cicy-desktop and that exposes `window.electronRPC`.

## Command → desktop shell command

| Command | Android | iOS |
|---------|---------|-----|
| `devices` | `adb devices -l` | `idevice_id -l` + `ideviceinfo -k DeviceName` |
| `screenshot` | `adb -s ID exec-out screencap -p` → `sips -Z 1200 -s format jpeg` → `base64` | `idevicescreenshot -u ID` → `sips … jpeg` → `base64` |
| `info` | `adb -s ID shell getprop …` | `ideviceinfo -u ID -k …` |
| `applist` | `adb -s ID shell pm list packages -3` | `ideviceinstaller -u ID -l` |
| `install` | `curl URL` → `adb -s ID install -r -d` | `curl URL` → `ideviceinstaller -u ID -i` |
| `tap` | `adb -s ID shell input tap X Y` | — |
| `swipe` | `adb -s ID shell input swipe X1 Y1 X2 Y2 [MS]` | — |
| `text` | `adb -s ID shell input text 'STR'` (spaces → `%s`) | — |
| `key` | `adb -s ID shell input keyevent KEYCODE` | — |
| `exec` | `adb -s ID shell <command>` | — |

Screenshots are downscaled to JPEG with macOS built-in `sips` to keep the RPC
payload small, then base64-decoded locally and written to a file (so the agent
can read the image). `--base64` returns the base64 directly.

## Key names (`key`)

`home back enter recents menu power up down delete` map to the matching
`KEYCODE_*`; any other value is passed through verbatim (e.g. `KEYCODE_VOLUME_UP`
or a raw keycode number).

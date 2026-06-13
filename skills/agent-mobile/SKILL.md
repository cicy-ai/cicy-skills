---
name: agent-mobile
description: Control USB-connected Android/iOS phones through a cicy-desktop client — adb / libimobiledevice over desktop_event RPC. Screenshot, info, app list, install; Android also tap/swipe/text/key/exec.
---

# Agent Mobile

This skill drives Android / iOS phones that are **plugged into a desktop
machine** (typically a Mac). The phones are not on this host — `agent-mobile`
runs `adb` and libimobiledevice (`idevice*`) commands **on the desktop machine**
by pushing `desktop_event { rpc_call, tool: 'exec_shell' }` to a connected
cicy-desktop client and awaiting the result. It is the mobile sibling of
`agent-desktop` (same transport) and reuses `agent-desktop`'s client resolution.

## Scope

Use this skill when the task involves a connected phone:

- listing connected phones — `agent-mobile devices`
- seeing the screen — `agent-mobile screenshot <device>` (saves a JPEG you can read)
- device facts — `agent-mobile info <device>`, `agent-mobile applist <device>`
- installing a build — `agent-mobile install <device> <apk|ipa|URL>`
- **Android only**, driving the UI — `tap`, `swipe`, `text`, `key`, `exec`

## Platform support

| Action | Android (adb) | iOS (libimobiledevice) |
|--------|:---:|:---:|
| devices / screenshot / info / applist / install | ✅ | ✅ |
| tap / swipe / text / key / exec | ✅ | ❌ (refused — v1) |

iOS input control (tap/type) needs WebDriverAgent / go-ios and is out of scope
for v1; iOS is screenshot + info + app list + install only.

## Rules

1. **Prerequisites** live on the desktop machine: a running cicy-desktop client
   (the one `agent-desktop` targets), plus `adb` and libimobiledevice
   (`idevice_id`, `idevicescreenshot`, `ideviceinfo`, `ideviceinstaller`)
   installed and on PATH. With no cicy-desktop client connected, every command
   fails with the same "no cicy-desktop client connected" error as `agent-desktop`.
2. Always start from `agent-mobile devices` to get the exact `<device>` id
   (Android serial or iOS udid) — every other command takes that id.
3. To drive a UI: `screenshot` → read the image → compute coordinates → `tap`/
   `swipe`/`text` → `screenshot` again to confirm. Re-shoot after each action.
4. Target a specific desktop client with `--client <client_id>` when more than
   one cicy-desktop is connected; otherwise it auto-selects the single one.
5. `install` downloads a URL (or copies a path) **on the desktop machine** — a
   local path must exist there, not on this host.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)

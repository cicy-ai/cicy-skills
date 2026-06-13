# agent-mobile

Control USB-connected **Android / iOS phones** through a connected **cicy-desktop**
client. The phones plug into the desktop machine (a Mac); this skill runs `adb`
and libimobiledevice commands on that machine over the same `desktop_event` RPC
that [`agent-desktop`](../agent-desktop) uses. Zero dependencies, Node ≥ 22.

```
agent-mobile devices                       # list connected phones
agent-mobile screenshot <device>           # → /tmp/agent-mobile-<id>.jpg
agent-mobile info <device>
agent-mobile applist <device>
agent-mobile install <device> <apk|ipa|URL>

# Android only:
agent-mobile tap   <device> 540 1200
agent-mobile swipe <device> 500 1500 500 400 300
agent-mobile text  <device> 'hello world'
agent-mobile key   <device> back
agent-mobile exec  <device> 'pm list packages'
```

`<device>` is the Android serial or iOS udid from `agent-mobile devices`.

## Prerequisites (on the desktop machine)

- a running **cicy-desktop** client (the one `agent-desktop` targets);
- **adb** (`brew install android-platform-tools`) for Android;
- **libimobiledevice** (`brew install libimobiledevice ideviceinstaller`) for iOS.

With no cicy-desktop client connected you'll get the same *"no cicy-desktop
client connected"* error as `agent-desktop`.

## Platform support

screenshot / info / applist / install work on **both** Android and iOS. UI input
(`tap`/`swipe`/`text`/`key`/`exec`) is **Android only** — iOS input control
(WebDriverAgent / go-ios) is out of scope for v1.

## Auth

`api_token` from `~/cicy-ai/global.json` (or `CICY_API_TOKEN`). `CICY_API_PORT`
overrides the cicy-code port (default 8008).

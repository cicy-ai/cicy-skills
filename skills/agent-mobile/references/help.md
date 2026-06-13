agent-mobile — control USB-connected Android / iOS phones through a cicy-desktop client.

The phones plug into a desktop machine (a Mac). This runs adb / libimobiledevice
commands ON that machine via the same desktop_event RPC that agent-desktop uses.

USAGE
  agent-mobile <command> [args] [--client ID] [--json]

COMMANDS
  devices                          List connected phones (id · platform · model)
  screenshot <device> [--out p]    Capture the screen. Default: JPEG at 50% quality
                                   (≈half size) → /tmp/agent-mobile-<id>.jpg
                                   --quality N  JPEG quality 1-100 (default 50)
                                   --lossless   full-resolution PNG, no quality loss
                                   --base64     print base64 instead of writing a file
  info <device>                    Model / OS version / build
  applist <device>                 Installed third-party apps
  install <device> <apk|ipa|URL>   Install an app (URL downloaded on the desktop machine)

  Android only (refused on iOS):
  tap   <device> <x> <y>                 Tap at pixel x,y
  swipe <device> <x1> <y1> <x2> <y2> [ms] Swipe (optional duration ms)
  text  <device> <string>                Type text into the focused field
  key   <device> <name|KEYCODE_*|n>      Key event: home back enter recents menu power up down delete
  exec  <device> <shell command>         Raw `adb shell` command

  help, --help, -h                 This help

OPTIONS
  --client, -c <id>   Target a specific cicy-desktop client (auto-selects the single one otherwise)
  --out <path>        screenshot: write the JPEG here
  --base64            screenshot: print base64 to stdout instead of writing a file
  --json              Machine-readable output: { ok, data } / { ok:false, error }

DEVICE ID
  <device> is the Android serial or iOS udid printed by `agent-mobile devices`.

AUTH / CONFIG
  api_token is read from ~/cicy-ai/global.json (override with CICY_API_TOKEN).
  CICY_API_PORT overrides the cicy-code port (default 8008).
  CICY_AGENT_TIMEOUT_MS overrides the RPC timeout (default 45000).

EXIT CODES
  0 ok · 2 usage · 3 environment (no client / no token / device offline) · 4 RPC/tool error

EXAMPLES
  agent-mobile devices
  agent-mobile screenshot R5CT… --out /tmp/s.jpg
  agent-mobile tap R5CT… 540 1200
  agent-mobile text R5CT… 'hello world'
  agent-mobile key R5CT… back
  agent-mobile install R5CT… https://r2.deepfetch.de5.net/cicy-mobile/cicy-latest.apk
  agent-mobile info 00008030-001A… --json

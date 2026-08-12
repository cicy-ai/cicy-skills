# chrome-cli — help

Local macOS/Linux Chrome only. For remote Chrome through a connected
cicy-desktop Electron RPC client, use `agent-chrome`.

`accountIdx` = profile ID = the `N` in `profile_N`.

```text
chrome-cli list [--all] [--json]                 alias of profiles
chrome-cli profiles [--all] [--json]             list local profiles
chrome-cli profile <N|chrome-N> [--json]          show config and live state
chrome-cli add [--id N] [--gmail E] [--note T] [--launch] [--json]
chrome-cli proxy <N|chrome-N> <url|"">             set/clear proxy for next launch
chrome-cli launch <N|chrome-N> [--url URL] [--json]
chrome-cli close <N|chrome-N> [--json]
chrome-cli targets --idx <N|chrome-N> [--json]
chrome-cli cdp <method> [json_params] --idx <N|chrome-N> [--target targetId] [--json]
chrome-cli tools
chrome-cli --help
```

Environment variables:

- `CHROME_CLI_CONFIG` — config path; default `~/cicy-ai/db/chrome.json`
- `CHROME_CLI_PROFILE_ROOT` — profile data root; default `~/chrome`
- `CHROME_CLI_DEBUGGER_BASE_PORT` — default `11000`
- `CHROME_CLI_BINARY` — explicit Chrome/Chromium executable

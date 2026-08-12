# chrome-cli

Manage local native Chrome profiles and CDP directly on macOS or Linux without cicy-desktop or Electron RPC. Use `agent-chrome` for remote Chrome on a connected cicy-desktop client.

```bash
cicy-code skill install chrome-cli
chrome-cli profiles
chrome-cli launch 1 --url https://example.com
chrome-cli cdp Browser.getVersion '{}' --idx 1
```

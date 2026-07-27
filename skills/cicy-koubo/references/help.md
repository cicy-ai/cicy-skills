# Command reference

```text
cicy-koubo install [--force]
  Run npx --yes cicy-koubo@latest --install-only. This downloads/caches the
  npm application and prepares Python/runtime dependencies without source.

cicy-koubo start [--port N] [--no-open]
  Start npx --yes cicy-koubo@latest as a detached managed process.
  Default port: 8770.
  Wait for HTTP readiness. Unless --no-open is set, open the local URL with
  agent-electron profile 1.

cicy-koubo stop
  Send SIGTERM only to the PID in the runtime state file. Escalate to SIGKILL
  only when that process does not exit within five seconds.

cicy-koubo restart [--port N] [--no-open]
  Stop, then start.

cicy-koubo rebuild
  Developer-only. Requires CICY_KOUBO_PROJECT pointing to a source checkout.

cicy-koubo update
  Refresh the npm package/dependencies and restore the prior running state.

cicy-koubo status [--json]
  Show installed/running/healthy, PID, port, URL, package specification,
  log path, and the response from GET /api/status when reachable.

cicy-koubo open
  Require a healthy service and open its URL via:
  agent-electron tab-open 1 <url>

cicy-koubo douyin <douyin-url>
  Validate the URL, open it via agent-electron profile 1, then focus the
  healthy workspace. It does not claim a completed download by itself.

cicy-koubo logs [--lines N] [--follow|-f]
  Print the last N lines (default 100), or exec tail -n N -f.

cicy-koubo doctor [--json]
  Check Node/npm/npx, Python, Flask/Pillow, ffmpeg, agent-electron, OS/WSL,
  local GPU, configured execution mode, Colab, and runtime system data.
```

Environment overrides for tests or non-default installations:

- `CICY_KOUBO_PROJECT`
- `CICY_KOUBO_STATE`
- `CICY_KOUBO_LOG`
- `CICY_KOUBO_PACKAGE`

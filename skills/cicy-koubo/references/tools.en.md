# Runtime contract

## Paths

| Item | Default |
|---|---|
| Application package | `npx cicy-koubo@latest` |
| Runtime state | `~/cicy-ai/db/cicy-koubo-runtime.json` |
| Combined stdout/stderr | `~/logs/cicy-koubo.log` |
| Application data | `~/projects/digital-human` |
| Default URL | `http://127.0.0.1:8770` |
| Browser identity | `agent-electron` profile 1 |

## Health

The process is `managed` only when the state PID exists and accepts signal 0.
It is `healthy` whenever `/` returns HTTP 200, including an
already-running development instance started outside this skill. `start`
adopts that healthy URL for opening instead of launching a duplicate. A live
managed PID without HTTP health is not ready.

## Exit codes

- `0`: command completed or the requested idempotent state already existed.
- `1`: runtime/dependency/npm/build/HTTP operation failed.
- `2`: invalid command, flag, port, or Douyin URL.

## Dependency boundary

The skill manages but does not vendor the npm application. `install` invokes
the package's dependency-only mode. The application owns Python/Flask/Pillow,
ffmpeg, engine, and Colab configuration. `doctor --json` exposes OS/WSL, local
GPU, configured execution mode, live `/api/system` data, and prerequisites.

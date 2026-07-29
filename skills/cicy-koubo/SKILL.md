---
name: cicy-koubo
description: Install and operate the source-free cicy-koubo spoken-video app, defaulting to temporary Cicy Cloud GPUs while supporting optional local NVIDIA WSL2 and Colab workflows.
---

# Cicy Koubo

Operate the npm-distributed `cicy-koubo` application for the 口播智能体.
Production users do not have the source repository. Never clone or require
`~/projects/cicy-koubo`; install and start the application through
`npx --yes cicy-koubo@latest`.

For any business task inside the workspace, read
[references/ui-workflows.md](./references/ui-workflows.md) before interacting
with the page. It is the canonical guide for every UI function, selectors,
prerequisites, success conditions, artifacts, and recovery steps.

## Commands

```sh
cicy-koubo setup [--region cn-hangzhou] [--no-open]
cicy-koubo gpu cicy|local|colab [--region REGION]
cicy-koubo install
cicy-koubo start [--port 8770] [--no-open]
cicy-koubo stop
cicy-koubo restart [--port 8770]
cicy-koubo rebuild
cicy-koubo update
cicy-koubo status [--json]
cicy-koubo open
cicy-koubo open-or-start
cicy-koubo douyin <url>
cicy-koubo logs [--lines 100] [--follow]
cicy-koubo doctor
```

Run `status` before changing runtime state. `start`, `stop`, `install`, and
`open` are idempotent. Use `restart` after configuration or backend changes.
`rebuild` is for a developer source checkout only. On a source-free user
machine, `update` refreshes the npm package and must not use git.

## Required workflow

1. For the normal zero-GPU-install path, run
   `cicy-koubo setup --region cn-hangzhou`. It installs the local UI, verifies
   that `~/cicy-ai/global.json` contains a Cicy Gateway key, selects
   `cicy_gpu`, and starts the workspace.
2. Run `cicy-koubo status --json`.
3. If setup was not used and the app is missing, run `cicy-koubo install`.
   This must provision the npm package and runtime dependencies without
   cloning source.
4. Run `cicy-koubo doctor --json` and use its `environment`, `execution`, and
   `system` fields to identify macOS/Linux/Windows/WSL, local GPU availability,
   configured execution mode, and whether Colab is actually in use.
5. Start with `cicy-koubo start`. It waits for HTTP readiness, records the
   managed PID, and opens `http://127.0.0.1:8770` with
   `agent-electron tab-open 1 ...`.
6. For a failed start, read `cicy-koubo logs --lines 120` and run
   `cicy-koubo doctor`. Report the concrete failed dependency or process.
7. Never report a queued/start attempt as healthy; `status.healthy` must be
   true.

## GPU selection

- Default to `cicy-koubo gpu cicy --region cn-hangzhou`. The local UI uses the
  Cicy Gateway key from `global.json`; Cloud checks the minimum USD balance,
  creates a temporary GPU, returns a short-lived endpoint/token, bills actual
  runtime, and releases the instance after the result is downloaded.
- Never download the 52 GB GPU image for a user who chooses Cicy GPU.
- Use `cicy-koubo gpu local` only when the user explicitly wants their own
  NVIDIA GPU. On WSL2, require a Windows NVIDIA WSL driver, Docker Desktop WSL
  integration, at least 80 GB free disk, and a successful
  `docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi`.
  Do not install a Linux NVIDIA kernel driver inside WSL.
- Use `cicy-koubo gpu colab` only when the user explicitly chooses Colab.

## Electron profile 1 is mandatory

- Open the workspace only through `cicy-koubo open` or
  `agent-electron tab-open 1 http://127.0.0.1:8770`.
- The cicy-code header button uses `cicy-koubo open-or-start`. It first checks
  profile 1 for the workspace URL. If found, it activates that tab and restores,
  shows, and focuses its owning window. If no matching tab exists, it starts the
  service when needed and then opens the workspace.
- For every Douyin link, run `cicy-koubo douyin <url>`. This opens or reuses
  the page in Electron account/profile 1 and then focuses the workspace.
- Do not use `open`, `agent-chrome`, Chrome debug ports, or another Electron
  profile for this workflow.
- The current command prepares the authenticated Douyin page in Electron; do
  not claim that media was downloaded until the workspace returns an actual
  extraction result or artifact path.

## State and safety

- Runtime state: `~/cicy-ai/db/cicy-koubo-runtime.json`.
- Service log: `~/logs/cicy-koubo.log`.
- Application data: `~/projects/digital-human/` (owned by the application).
- Model/provider secrets remain in the application's existing configuration;
  never print complete keys, cookies, or OAuth tokens.
- `stop` only signals the PID recorded by this skill. Do not kill by broad
  process name or port.
- `rebuild` and `update` preserve whether the service was running: stop,
  perform the operation, then start again only if it was previously running.

Read [references/help.md](./references/help.md) for exact flags and
[references/tools.md](./references/tools.md) for paths, dependencies, health
semantics, and exit codes.

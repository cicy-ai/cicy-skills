---
name: us-spot-dev
description: Provision a US (Silicon Valley) Aliyun spot ECS dev box with a persistent ESSD data disk. Use when the user asks to spin up, rebuild, or destroy the US spot dev environment.
---

# US Spot Dev

Provisions a cheap, disposable US (us-west-1) Aliyun spot ECS instance backed by a **persistent 100 GB ESSD data disk** (`us-spot-dev-data`).

The split keeps everything that matters — `/home/cicy`, Docker images, `~/cicy-ai`, repos — on the disk. If the spot instance is reclaimed, re-run `us-spot-dev` to get a fresh box with your data intact.

## Scope

Use this skill when the task involves:

- spinning up or re-provisioning the US spot dev instance
- destroying the instance (while keeping the data disk)
- rebuilding and pushing the container image

## Rules

1. `us-spot-dev` (no args) provisions a new spot instance, attaches the persistent disk, starts Docker and the `us-spot-dev` container, then bootstraps cicy on a fresh disk.
2. The data disk (`us-spot-dev-data`) is **never deleted** by any `us-spot-dev` command; it survives `--destroy`.
3. Use `--json` for scriptable / agent-driven flows.
4. Read [help.md](./references/help.md) for the full workflow and [tools.md](./references/tools.md) for the command reference.

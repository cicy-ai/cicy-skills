---
name: hk-spot-dev
description: Provision an HK (Hong Kong) Aliyun spot ECS dev box with a persistent ESSD data disk. Use when the user asks to spin up, rebuild, or destroy the HK spot dev environment.
---

# HK Spot Dev

Provisions a cheap, disposable Hong Kong (cn-hongkong) Aliyun spot ECS instance backed by a **persistent 100 GB ESSD data disk** (`hk-spot-dev-data`).

The same persistent-disk pattern as `us-spot-dev`: if the spot instance is reclaimed, re-run `hk-spot-dev` to restore access with data intact.

## Scope

Use this skill when the task involves:

- spinning up or re-provisioning the HK spot dev instance
- destroying the instance (while keeping the data disk)
- rebuilding and pushing the container image

## Rules

1. `hk-spot-dev` (no args) provisions a new spot instance, attaches the persistent disk, starts Docker and the `hk-spot-dev` container, then bootstraps cicy on a fresh disk.
2. The data disk (`hk-spot-dev-data`) is **never deleted** by any `hk-spot-dev` command; it survives `--destroy`.
3. Use `--json` for scriptable / agent-driven flows.
4. Read [help.md](./references/help.md) for the full workflow and [tools.md](./references/tools.md) for the command reference.

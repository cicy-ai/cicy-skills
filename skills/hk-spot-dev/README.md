# hk-spot-dev

> Provision a disposable Aliyun spot ECS dev box with a persistent data disk.

## Install

```bash
cicy-code skill install hk-spot-dev
```

## Usage

```bash
hk-spot-dev                  # provision / re-provision
hk-spot-dev --destroy        # tear down instance (disk kept)
hk-spot-dev --push-image     # rebuild + push container image
hk-spot-dev --json           # machine-readable output
```

See [help.md](./references/help.md) for full workflow.

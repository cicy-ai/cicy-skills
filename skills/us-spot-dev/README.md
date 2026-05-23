# us-spot-dev

> Provision a disposable Aliyun spot ECS dev box with a persistent data disk.

## Install

```bash
cicy-code skill install us-spot-dev
```

## Usage

```bash
us-spot-dev                  # provision / re-provision
us-spot-dev --destroy        # tear down instance (disk kept)
us-spot-dev --push-image     # rebuild + push container image
us-spot-dev --json           # machine-readable output
```

See [help.md](./references/help.md) for full workflow.

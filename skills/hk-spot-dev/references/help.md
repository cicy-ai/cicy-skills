# HK Spot Dev Help

## What it is

A persistent-disk + spot-instance pattern for a cheap HK dev box:

- **Persistent disk** `hk-spot-dev-data` (100 GB ESSD, cn-hongkong-d) — never deleted.
  Holds `/home/cicy`, `/data/docker` (Docker data-root), repos, `~/cicy-ai`, SSH state.
- **Spot instance** (`ecs.u1-c1m8.large`, cn-hongkong-d) — disposable. Billed by the hour, may be reclaimed.

On re-provision the Docker image is reused from disk. On a fresh disk `hk-spot-dev` pulls the pre-built image from Docker Hub.

## Typical workflow

```sh
# First time / after reclaim: provision
hk-spot-dev

# Tear down instance when not needed (disk kept)
hk-spot-dev --destroy

# After changing Dockerfile: push new image
hk-spot-dev --push-image
```

## SSH access

After provisioning, `~/.ssh/config` is updated with a `hk-spot-dev` host entry:

```sh
ssh hk-spot-dev
```

The DNS hostname is derived from the Cloudflare tunnel config and updated automatically.

## Config

No config file required. Credentials come from `~/cicy-ai/global.json` (Aliyun AK/SK, Cloudflare token).

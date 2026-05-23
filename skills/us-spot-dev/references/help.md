# US Spot Dev Help

## What it is

A persistent-disk + spot-instance pattern for a cheap US dev box:

- **Persistent disk** `us-spot-dev-data` (100 GB ESSD, us-west-1a) — never deleted.
  Holds `/home/cicy`, `/data/docker` (Docker data-root), repos, `~/cicy-ai`, SSH state.
- **Spot instance** (`ecs.e-c1m4.xlarge`, us-west-1a) — disposable. Billed by the hour, may be reclaimed.

On re-provision the Docker image is reused from disk. On a fresh disk `us-spot-dev` pulls the pre-built image from Docker Hub.

## Typical workflow

```sh
# First time / after reclaim: provision
us-spot-dev

# Tear down instance when not needed (disk kept)
us-spot-dev --destroy

# After changing Dockerfile: push new image
us-spot-dev --push-image
```

## SSH access

After provisioning, `~/.ssh/config` is updated with a `us-spot-dev` host entry:

```sh
ssh us-spot-dev
```

The DNS hostname is derived from the Cloudflare tunnel config and updated automatically.

## Config

No config file required. Credentials come from `~/cicy-ai/global.json` (Aliyun AK/SK, Cloudflare token).

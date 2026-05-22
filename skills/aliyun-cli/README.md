# aliyun-cli — Aliyun CLI bootstrap

> Source-only Node.js, 222 LOC. Read [`bin/aliyun-cli`](./bin/aliyun-cli).

This wrapper has **three jobs only**: `install`, `config`, `status`.
For real Aliyun API calls (ECS, VPC, RAM, OSS, …) use the official `aliyun`
binary directly.

## Install

```bash
cicy-code skill install aliyun-cli
```

## Bootstrap

```bash
aliyun-cli status            # is the official aliyun binary installed? is config ready?
aliyun-cli install           # download official aliyun binary into ~/.local/bin
aliyun-cli config            # open ~/.aliyun/config.json in $EDITOR
aliyun ecs DescribeRegions   # use the real CLI directly from now on
```

## Notes

- The native config at `~/.aliyun/config.json` is the single source of truth — no intermediate JSON.
- Pinned aliyun version: `3.0.290`. Override with `CICY_ALIYUN_DOWNLOAD_URL` if you need a different release.

## License

MIT

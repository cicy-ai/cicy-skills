# aliyun-cli — help

## Commands

```
aliyun-cli install [--force]      Install the official aliyun binary into ~/.local/bin
aliyun-cli config                 Open ~/.aliyun/config.json in $EDITOR (creates placeholder)
aliyun-cli status [--json]        Show install + config state (access key id masked)
aliyun-cli --help / -h / help     Print this help
```

For ANY real Aliyun API call use the native `aliyun` binary directly:

```
aliyun ecs DescribeRegions
aliyun oss ls oss://my-bucket/
aliyun ram ListUsers
```

## Environment

- `CICY_ALIYUN_CONFIG` — override path (default `~/.aliyun/config.json`)
- `CICY_ALIYUN_DOWNLOAD_URL` — override binary download URL
- `EDITOR`/`VISUAL` — editor for `aliyun-cli config`

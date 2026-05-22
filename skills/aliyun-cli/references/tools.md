# aliyun-cli — tools

## What it does

Three bootstrap jobs only:
1. download the official `aliyun` binary
2. open the native `~/.aliyun/config.json` for editing
3. report installation state

For everything else, **use the `aliyun` binary directly**.

## File operations

| op    | path                       | mode | when             |
|-------|----------------------------|------|------------------|
| write | `~/.local/bin/aliyun`      | 0755 | `install`        |
| write | `~/.aliyun/config.json`    | 0600 | `config` (placeholder) |
| read  | `~/.aliyun/config.json`    | —    | `status`         |

`status` reads the file but **only emits a masked AccessKeyID**, never the
secret. Agent must NOT cat / read the live file.

## External downloads

GitHub Releases of `aliyun/aliyun-cli`:
- macOS  amd64 / arm64 → `aliyun-cli-macosx-<v>-<arch>.tgz`
- Linux  amd64 / arm64 → `aliyun-cli-linux-<v>-<arch>.tgz`
- Windows amd64        → `aliyun-cli-windows-<v>-amd64.zip`

Pinned version: `3.0.290`.

## Environment variables

- `CICY_ALIYUN_CONFIG` — override config path
- `CICY_ALIYUN_DOWNLOAD_URL` — override binary url
- `EDITOR`/`VISUAL` — for `aliyun-cli config`

## JSON output

`status --json`:

```json
{
  "ok": true,
  "data": {
    "binary_path": "/home/<user>/.local/bin/aliyun",
    "binary_installed": true,
    "binary_version": "3.0.290",
    "config_path": "/home/<user>/.aliyun/config.json",
    "config_exists": true,
    "config_permissions": "0600",
    "current_profile": "default",
    "access_key_id_masked": "LTAI***xyz"
  }
}
```

## Exit codes

See [help.md](./help.md).

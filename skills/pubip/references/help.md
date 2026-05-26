# pubip — help

## Usage

```
pubip          # prints IP, e.g. 117.136.71.183
pubip --json   # {"ok":true,"data":{"ip":"117.136.71.183"}}
pubip --help   # this text
```

## Behavior

- Strips `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` (and
  lowercase variants) from curl's env
- Adds `curl --noproxy '*'` to bypass any compiled-in defaults
- 10s timeout (`-m 10`)
- Endpoint: `https://ifconfig.me`

Non-zero exit on curl failure; error message goes to stderr (or into the
`error.message` field with `--json`).

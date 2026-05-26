# pubip

> Source-only Node.js shim around `curl --noproxy '*' https://ifconfig.me`.
> Requires `curl` on PATH.

Print the host's **real** public IP, ignoring every proxy.

## Install

```bash
cicy-code skill install pubip
```

## Usage

```bash
pubip
# → 117.136.71.183

pubip --json
# → {"ok":true,"data":{"ip":"117.136.71.183"}}
```

## License

MIT

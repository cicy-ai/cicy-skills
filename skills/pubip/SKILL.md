---
name: pubip
description: Print the host's real public IP by curl-ing https://ifconfig.me with all proxies disabled.
---

# pubip

Returns the public IP the host actually exits from, **bypassing every
proxy** — environment vars (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`,
lowercase variants) are unset, and `curl --noproxy '*'` is passed so any
proxy compiled into curl's defaults is also ignored.

## When to use

- Confirming the machine's actual egress IP regardless of mihomo/socks
  setup
- Verifying that a VPN or system proxy is **not** being applied
- Comparing direct vs proxied IP (run `pubip` direct, then
  `curl --socks5 ... ifconfig.me` for the proxied side)

## References

- [help.md](./references/help.md)

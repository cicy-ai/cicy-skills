# rustdesk-selfhost

Deploy a self-hosted [RustDesk](https://rustdesk.com) server (hbbs/hbbr) and
generate the exact client config, TOML, and one-click Windows enrollment scripts
your fleet needs to reach it.

```sh
rustdesk-selfhost server-up --relay rd.example.com   # start the server, get the key
rustdesk-selfhost firewall gcloud                    # open the ports (incl. udp:21116)
rustdesk-selfhost config host=rd.example.com password=<pw>
rustdesk-selfhost client-config                      # control machine: type into GUI
rustdesk-selfhost enroll-script > fix.bat            # managed hosts: Run as administrator
```

Encodes the four fixes that make RustDesk self-hosting actually work: keeping the
server key stable, opening UDP 21116, broadcasting a public relay, and using a
DNS-only endpoint. See [SKILL.md](./SKILL.md).

Zero npm dependencies · Node 18+ · docker on the server host.

# HK Spot Dev Commands

| Command | What it does |
|---------|--------------|
| `hk-spot-dev` | Provision spot instance + attach persistent disk + start Docker container |
| `hk-spot-dev --destroy` | Delete the spot instance (persistent disk is always kept) |
| `hk-spot-dev --push-image` | Rebuild container image on the running box and push to registry |
| `hk-spot-dev --json` | Same as above but emit JSON output (agent-friendly) |

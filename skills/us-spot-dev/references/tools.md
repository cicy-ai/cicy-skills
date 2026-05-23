# US Spot Dev Commands

| Command | What it does |
|---------|--------------|
| `us-spot-dev` | Provision spot instance + attach persistent disk + start Docker container |
| `us-spot-dev --destroy` | Delete the spot instance (persistent disk is always kept) |
| `us-spot-dev --push-image` | Rebuild container image on the running box and push to registry |
| `us-spot-dev --json` | Same as above but emit JSON output (agent-friendly) |

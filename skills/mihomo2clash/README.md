# mihomo2clash

> Zero-dependency Node.js converter: cicy `mihomo.yaml` → standard Clash config.

```bash
cicy-code skill install mihomo2clash
mihomo2clash convert            # writes ~/projects/clash-config.yaml
mihomo2clash check              # dry run
```

Strips cicy/mihomo-only parts (listeners, IN-* rules, auth, `type: direct`
node, default-deny MATCH,REJECT) and emits a config any Clash client can
import as a local file or — served via `lanshare` — as a remote profile.

MIT

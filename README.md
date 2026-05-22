# cicy-skills

Open-source registry of **transparent, auditable Node.js skills** for the
[cicy-code](https://github.com/cicy-ai/cicy-code) ecosystem and any compatible
agent (Claude Code, Codex CLI, OpenCode, Kiro CLI, …).

> Skills are pure JavaScript source — no compiled binaries, no opaque blobs.
> Read every line of code before installing. That's the point.

- 📦 **Registry index**: <https://skills.cicy-ai.com> (Cloudflare Worker, KV-only)
- 📥 **Distribution**: GitHub Releases on this repo (zip assets)
- 🛠 **Installer**: ships with `cicy-code` (run `cicy-code skill --help`)
- 📚 **Spec**: see [docs in cicy-code repo](https://github.com/cicy-ai/cicy-code/tree/main/docs)

## Distribution model

- **Source of truth**: this repo (`github.com/cicy-ai/cicy-skills`)
- **Storage**: GitHub Releases — every `<name>-v<X.Y.Z>` tag publishes a
  release with a `<name>-<X.Y.Z>.zip` asset
- **Index**: a Cloudflare Worker at `skills.cicy-ai.com` keeps a KV index of
  manifests + `download_url` pointing at the GitHub Release asset; the Worker
  never stores binaries
- **Third-party repos**: `cicy-code skill install --repo <owner>/<repo> <name>`
  reads any public GitHub repo directly, bypassing the official index
- **Custom URLs**: `cicy-code skill install --url <zip-url>` works with any zip

---

## Why?

Earlier versions of cicy-skills shipped Go binaries. That's fast and tidy, but:

- Users can't audit what a skill actually does
- Distributing a skill required a full cicy-code release
- Adding a new skill needed source-code changes to the main repo

**v2 fixes all three.** Every skill is plain Node.js source, lives here,
versioned independently, distributed via Cloudflare R2/Workers.

## Layout

```
cicy-skills/
├── schemas/
│   └── manifest.schema.json      # JSON Schema for skill manifests
├── templates/
│   └── skill-template/           # scaffold for new skills
├── tools/
│   ├── validate-skill.js         # validate a single skill dir
│   ├── pack-skill.js             # produce <name>-<version>.zip + sha256
│   └── publish.js                # upload to registry (admin only)
├── skills/
│   ├── cping/                    # ← reference: zero-dependency
│   ├── cf-tunnel/
│   └── ...
└── .github/workflows/
    ├── validate.yml              # PR validates every skill
    └── publish.yml               # tag <name>-vX.Y.Z → R2 + KV
```

## Skill anatomy

Every skill is a self-contained directory under `skills/`:

```
skills/<name>/
├── manifest.json     # ← metadata (required)
├── SKILL.md          # ← agent-facing instructions (required)
├── README.md         # ← human-facing overview (required)
├── help.md           # command usage
├── tools.md          # endpoint / env / exit-code map
├── bin/<name>        # #!/usr/bin/env node entry (required)
├── lib/*.js          # optional split modules
├── package.json      # only when npm deps are required
└── package-lock.json
```

### Coding rules

1. Prefer **system CLI** (`curl`, `jq`, `git`, `ssh`) — leverage the host.
2. Then **Node built-ins** (`fetch`, `fs`, `crypto`, `child_process`).
3. **npm dependencies** only when truly necessary, with `package-lock.json`
   committed.
4. **No TypeScript**, **no bundlers**. Source IS distribution.
5. **No Bash entrypoints** — for consistency, `bin/<name>` is always Node.
6. Configuration lives in `~/cicy-ai/db/<name>.json` (mode 0600).

See [`docs/skills-v2-manifest.md`](https://github.com/cicy-ai/cicy-code/blob/main/docs/skills-v2-manifest.md) for the full manifest spec.

## Quick start (author)

```bash
# 1. Scaffold
cp -r templates/skill-template skills/my-skill
cd skills/my-skill
$EDITOR manifest.json SKILL.md bin/my-skill

# 2. Validate locally
node ../../tools/validate-skill.js .

# 3. Test
./bin/my-skill --help

# 4. Pack
node ../../tools/pack-skill.js .

# 5. Publish (only maintainers)
ADMIN_TOKEN=... node ../../tools/publish.js my-skill@1.0.0
```

## Quick start (user)

```bash
# In a host with cicy-code installed:
cicy-code skill list                  # see what's available
cicy-code skill info cping            # detail
cicy-code skill install cping         # install from official index
cping example.com                     # use it
cicy-code skill remove cping          # uninstall
```

### Install from third-party / custom sources

```bash
# from any public GitHub repo (single-skill or monorepo with skills/<name>/)
cicy-code skill install --repo myname/my-skills my-tool

# from a custom zip URL (must provide --sha256 for integrity)
cicy-code skill install --url https://example.com/my-tool.zip \
                        --sha256 abc123...

# clone via git (development / private repo)
cicy-code skill install --git git@github.com:myname/my-tool.git

# local development
cicy-code skill dev ./my-skill-dir
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Pull requests welcome.

## License

Each skill declares its own license in `manifest.json`. Most are MIT.
The repo as a whole is MIT-licensed (see [LICENSE](./LICENSE)).

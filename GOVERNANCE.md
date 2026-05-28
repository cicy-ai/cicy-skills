# Skill Governance

How skills are created, tiered, fixed, and published in the cicy ecosystem.
For the mechanical PR checklist see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Tiers

There is exactly **one skill format** (manifest + bin + SKILL.md + tests). The
deprecated `skill-author` "SKILL.md-only" user-skill format has been removed —
it created a second, incompatible shape. A skill differs only by *where it
lives*, not by its structure:

| Tier | Location | Who can write | In registry | Use |
|------|----------|---------------|-------------|-----|
| **Official** | this repo, `skills/<name>/` | PR + maintainer merge | ✅ maintainer tags `<name>-vX.Y.Z` → CI publishes | everyone, via `cicy-code skill install <name>` |
| **Local / private** | `~/cicy-ai/skills/<name>/` | the user, directly | ❌ never uploaded | personal, unreleased, or private-logic skills |
| **Draft** | either location, mid-build | — | — | until `validate-skill` + tests pass |

Because the structure is identical, a local skill can be promoted to official by
opening a PR with the same directory — no rewrite.

## Local skills & local-over-registry precedence

cicy-code's skill loader scans **both** the registry install dir and
`~/cicy-ai/skills/`. When a name exists in both, **the local copy wins** — so a
user can hotfix or override an official skill without waiting for a release. The
UI marks each skill `source: local | registry`.

```sh
cicy-code skill eject <name>   # copy an installed official skill into
                               # ~/cicy-ai/skills/<name>/ to patch locally
# edit → effective immediately (local shadows registry)
# then upstream the fix via a PR (see below)
```

## Found a bug in an official skill

1. **Report** — open a GitHub issue on `cicy-ai/cicy-skills` with
   **skill name + version + repro steps**.
2. **Can't wait?** `cicy-code skill eject <name>`, patch locally, keep working.
3. **Upstream the fix** — PR (next section). Local override is a stopgap, not a fork.

## Contributing / PR flow

Anyone may contribute code; **publishing is maintainer-gated** (needs the admin
token). Code and publish rights are deliberately separate.

1. Fork → branch → edit `skills/<name>/`.
2. **Bump `version` in `manifest.json`** per semver:
   bugfix → patch, new flag/command → minor, breaking change → major.
3. Validate locally: `node tools/validate-skill.js skills/<name>` and run `test/`.
4. Open the PR. CI gates: manifest schema, `bin/<name>` executable +
   `#!/usr/bin/env node`, SKILL.md frontmatter `name`/`description` == manifest,
   `npm audit` (if a package.json exists).
5. Maintainer reviews and merges. **Only a maintainer** then tags
   `<name>-vX.Y.Z`, which triggers the GitHub Action running `tools/publish.js`
   (admin-token-gated) to upload the zip and register it.

## Hard rules (enforced in review / CI)

- **Source is the distribution** — no build artifacts, no minification.
- Prefer `curl` + native `fetch` + `fs`; avoid npm dependencies.
- **No `postinstall`** scripts (the installer runs `--ignore-scripts`).
- **Secrets** are read at runtime from `~/cicy-ai/db/<name>.json` (or
  `~/cicy-ai/global.json`); never commit them, never print/cat secret files.
- `bin/<name>` ≤ 500 lines; every command supports `--json`.
- Exit codes follow the 0–5 convention (0 ok · 1 generic · 2 usage · 3 missing
  dep/config · 4 missing prereq · 5 reserved).

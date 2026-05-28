# Contributing to cicy-skills

Thanks for your interest! This repo is the canonical home of all
**transparent, source-only skills** for the cicy-code ecosystem.

> For the bigger picture — skill tiers (official / local / draft), local-over-registry
> precedence, `skill eject`, and how to report bugs in published skills — see
> [GOVERNANCE.md](./GOVERNANCE.md).

## Ground rules

1. **Source is distribution.** No compiled artifacts in the repo.
2. **Every line is auditable.** Users will read your code; write it that way.
3. **Minimum dependencies.** Prefer `curl` + `fetch` + `fs` over npm packages.
4. **Lock everything.** If you must use npm deps, commit `package-lock.json`.
5. **No `postinstall` scripts.** Installer runs `npm ci --ignore-scripts`.
6. **No PII in the repo.** Use `~/cicy-ai/db/<name>.json` for secrets at runtime.

## Workflow

1. Open an issue describing the proposed skill (or fix).
2. Fork → branch → implement.
3. Run local validation:
   ```bash
   node tools/validate-skill.js skills/<your-skill>
   ```
4. Open a pull request. CI will:
   - Validate every changed skill against the JSON Schema
   - Check `bin/<name>` is executable and starts with `#!/usr/bin/env node`
   - Verify `SKILL.md` frontmatter matches `manifest.json`
   - Run `npm audit` if `package.json` exists
5. After review + merge, a maintainer creates a tag like `<name>-vX.Y.Z`.
   The publish workflow uploads the zip to R2 and updates the registry KV.

## Naming

- skill name: `^[a-z][a-z0-9_-]*$`, ≤ 64 chars
- semver, no leading `v`, no `0.0.0`
- one skill per directory

## Versioning

Strict [SemVer 2.0.0](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- breaking change → bump MAJOR
- back-compat new feature → bump MINOR
- bug fix → bump PATCH

`0.x.y` denotes unstable API. Once you ship `>=1.0.0`, breaking changes
require a new major.

## Releasing

Only maintainers with admin token can publish. The flow:

```
git tag <name>-vX.Y.Z   # e.g. cping-v1.0.0
git push origin <name>-vX.Y.Z
# → GitHub Action runs tools/publish.js automatically
```

Manual publish (rare):

```bash
ADMIN_TOKEN=... node tools/publish.js <name>@<version>
```

## Code review focus

Reviewers check:

- Does the skill do what its `description` says, and nothing more?
- Are secrets only read from `~/cicy-ai/db/`?
- Is `bin/<name>` ≤ 500 lines? If not, split into `lib/`.
- Are exit codes consistent with the spec (0/1/2/3/4/5)?
- Is `--json` supported on every command?
- Is there a `help.md` with concrete examples?

## Code style

- ESM (`import` / `export`), Node 18+
- 2-space indent, single quotes, semicolons
- `node --test` for tests, no test framework dependency
- No `var`. Prefer `const`. `let` only when reassigning.
- No top-level side effects in `lib/` modules.

## Reporting security issues

Email **security@cicy-ai.com** (PGP key in repo root). Do **not** open
public issues for security vulnerabilities.

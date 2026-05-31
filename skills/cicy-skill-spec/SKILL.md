---
name: cicy-skill-spec
description: Conventions for the cicy skill ecosystem: private skill development, team skill install layout, and public skill PR submission. Scaffolds new skills into the right directory.
---

# Cicy Skill Spec

The authoritative conventions for the cicy skill ecosystem. Read this before
creating, installing, or publishing any skill. There are **three kinds of
skill**, and each has a fixed home on disk.

## Scope

Use this skill when you (an agent or a human) are about to:

- **build a new private skill** for yourself or your team,
- **install** a skill shared by another team,
- **submit a public skill** (PR) to the shared registry,
- or are unsure *where a skill should live* on disk.

Do **not** use this skill for: running an already-installed skill, or general
coding unrelated to packaging skills.

## The three kinds of skill & where they live

```
~/cicy-ai/skills/
├── <name>/                  # PUBLIC  — from skills.cicy-ai.com (flat)
├── private/<name>/          # PRIVATE — your own, from your local registry (localhost)
└── team/<team>/<name>/      # TEAM    — installed from another team's private registry
```

Install location is decided **by the source the skill came from** (see
`cicy-skill-spec paths`):

| Source | Example | Installs to |
|--------|---------|-------------|
| Public registry | `skills.cicy-ai.com` | `~/cicy-ai/skills/<name>/` |
| Your own local registry | `http://localhost:8787` (host is localhost/127.0.0.1) | `~/cicy-ai/skills/private/<name>/` |
| Another team's registry | `http://team-a-host:8787` | `~/cicy-ai/skills/team/team-a/<name>/` |

---

## 1. Private skill development spec

A private skill is one you build for yourself or your team and **must not push
to the public registry**.

**Rule: when an agent creates its own private skill, scaffold it into
`~/cicy-ai/skills/private/<name>/` — never into the flat root and never into a
public-PR checkout.**

```sh
cicy-skill-spec scaffold <name> --private    # → ~/cicy-ai/skills/private/<name>/
```

Skeleton (same shape as any cicy skill):

```
<name>/
├── manifest.json     # name == dir name; entry "bin/<name>"; bump version each publish
├── SKILL.md          # frontmatter description MUST equal manifest.description exactly
├── README.md
├── bin/<name>        # #!/usr/bin/env node, chmod +x, zero deps preferred
└── references/{help.md,tools.md}
```

To share it with teammates, host a private registry on your machine and publish
into it:

```sh
cicy-code skill registry serve --dir ~/cicy-registry-data --token <READ_TOKEN> --admin-token <ADMIN>
cicy-code skill registry publish ~/cicy-ai/skills/private/<name>
```

Then hand teammates the **address + token** (see §2). Secrets a skill needs at
runtime go in `~/cicy-ai/db/<name>.json` or `~/cicy-ai/global.json` — **never
commit secrets into the skill**.

---

## 2. Team skill install spec

To use a skill another team shares, add their registry as a source, then
install. The skill lands in `team/<team>/<name>/` automatically.

```sh
cicy-code skill registry add http://team-a-host:8787 --name team-a --token <THEIR_TOKEN>
cicy-code skill registry sources                 # verify it was added
cicy-code skill install <name>                   # by precedence
cicy-code skill install team-a/<name>            # or pin the source explicitly
```

(The marketplace UI has the same flow under **🔒 私有库 → 连接私有库**.)

Resolution rules when the same name exists in several sources:

- a **private/team** skill shadows a **public** one of the same name,
- among private sources, the **last-added** wins,
- use `<source>/<name>` to override and pick a specific source.

Each team's skill stays in its own `team/<team>/` subtree, so same-named skills
from different teams do not collide on disk.

---

## 3. Public skill PR submission spec

Public skills live in the **cicy-skills** repo and are served from
`skills.cicy-ai.com`. Publishing is **PR + tag driven** — never push assets by
hand.

```sh
cicy-skill-spec scaffold <name>          # → ./<name>/ in your cicy-skills checkout

# 1. develop under skills/<name>/ in a branch/fork of cicy-skills
# 2. bump manifest.version on every release (even if only metadata changed)
# 3. validate + test (must pass before PR):
node tools/validate-skill.js skills/<name>
node tools/test-skill.js skills/<name>
# 4. open a PR against cicy-ai/cicy-skills
# 5. after merge, publish is triggered by pushing a tag:
git tag <name>-v<version> && git push origin <name>-v<version>
```

**Hard rules (publishing):**

- **Never run `node tools/publish.js` by hand.** Publishing happens only via the
  GitHub Action on tag push, which packs + releases + registers from one
  artifact so the asset sha256 always matches the registry.
- The registry treats `(name, version)` as **immutable**. If a sha mismatch ever
  appears, you cannot overwrite — **bump to a new version** and re-tag.
- `category` must be one of: `network cloud ai dev system productivity agent infra other`.
- SKILL.md frontmatter `description` must **exactly equal** manifest `description`.

---

## Quick start

```sh
cicy-skill-spec spec                  # print these conventions
cicy-skill-spec paths                 # print the directory layout
cicy-skill-spec scaffold foo --private   # new private skill in ~/cicy-ai/skills/private/foo
cicy-skill-spec scaffold foo             # new public skill in ./foo for a PR
```

## References

- [help.md](./references/help.md) — full command reference
- [tools.md](./references/tools.md) — directory map, env, related commands

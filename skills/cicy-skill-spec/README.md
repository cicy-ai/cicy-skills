# Cicy Skill Spec

The authoritative conventions for the cicy skill ecosystem, packaged as a skill
so any agent can read it on demand.

It defines:

1. **Private skill development** — build your own skill into
   `~/cicy-ai/skills/private/<name>/` and host it from your machine.
2. **Team skill install** — add another team's registry (`address + token`) and
   install; the skill lands in `~/cicy-ai/skills/team/<team>/<name>/`.
3. **Public skill PR submission** — develop under `cicy-skills/skills/<name>/`,
   bump the version, validate + test, open a PR, then tag to publish.

## Usage

```sh
cicy-skill-spec spec                  # print the full conventions
cicy-skill-spec paths                 # print the install directory layout
cicy-skill-spec scaffold foo --private   # new private skill → ~/cicy-ai/skills/private/foo
cicy-skill-spec scaffold foo             # new public skill → ./foo (for a cicy-skills PR)
cicy-skill-spec scaffold foo --team team-a  # skeleton under ~/cicy-ai/skills/team/team-a/foo
```

See [SKILL.md](./SKILL.md) for the full spec.

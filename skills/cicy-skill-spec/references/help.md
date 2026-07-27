# cicy-skill-spec — command reference

```
cicy-skill-spec spec                       Print the full conventions (SKILL.md)
cicy-skill-spec paths                      Print the source-based install layout
cicy-skill-spec scaffold <name>            New PUBLIC skill skeleton in ./<name>/
cicy-skill-spec scaffold <name> --private  New PRIVATE skill in ~/cicy-ai/skills/private/<name>/
cicy-skill-spec scaffold <name> --team <t> New skeleton in ~/cicy-ai/skills/team/<t>/<name>/
cicy-skill-spec scaffold <name> --dir <p>  New skeleton in <p>/<name>/
cicy-skill-spec --help                     Same as `spec`
```

## scaffold

Generates a complete, valid skill skeleton: `manifest.json`, `SKILL.md`
(frontmatter description kept equal to the manifest), `README.md`,
`bin/<name>` (executable), and static bilingual documentation:
`references/{help.en.md,help.cn.md,tools.en.md,tools.cn.md}`.

Refuses to overwrite an existing directory. The skill name must be
lowercase letters, digits and hyphens.

**Mode → location:**

| Flag | Location | Use for |
|------|----------|---------|
| `--private` | `~/cicy-ai/skills/private/<name>/` | your own skill (agents default here) |
| `--team <t>` | `~/cicy-ai/skills/team/<t>/<name>/` | seeding a team skill locally |
| `--dir <p>` / none | `<p>/<name>/` or `./<name>/` | public skill for a cicy-skills PR |

`CICY_SKILLS_ROOT` overrides `~/cicy-ai/skills`.

# cicy-skill-spec — 命令参考

```
cicy-skill-spec spec                       打印完整规范（SKILL.md）
cicy-skill-spec paths                      打印基于源码的安装布局
cicy-skill-spec scaffold <name>            在 ./<name>/ 中创建公开技能骨架
cicy-skill-spec scaffold <name> --private  在 ~/cicy-ai/skills/private/<name>/ 中创建私有技能
cicy-skill-spec scaffold <name> --team <t> 在 ~/cicy-ai/skills/team/<t>/<name>/ 中创建骨架
cicy-skill-spec scaffold <name> --dir <p>  在 <p>/<name>/ 中创建骨架
cicy-skill-spec --help                     等同于 `spec`
```

## scaffold

生成完整且有效的技能骨架：`manifest.json`、`SKILL.md`（frontmatter 描述与 manifest 保持一致）、`README.md`、`bin/<name>`（可执行文件）以及 `references/{help.md, tools.md}`。

拒绝覆盖已存在的目录。技能名称必须为小写字母、数字和连字符的组合。

**模式 → 位置：**

| 标志 | 位置 | 用途 |
|------|----------|---------|
| `--private` | `~/cicy-ai/skills/private/<name>/` | 个人技能（智能体默认在此） |
| `--team <t>` | `~/cicy-ai/skills/team/<t>/<name>/` | 在本地为团队技能创建种子 |
| `--dir <p>` / 无 | `<p>/<name>/` 或 `./<name>/` | 用于 cicy-skills PR 的公开技能 |

`CICY_SKILLS_ROOT` 可覆盖 `~/cicy-ai/skills` 路径。

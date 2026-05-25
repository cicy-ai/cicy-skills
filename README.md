# cicy-skills

Open-source skill registry for [cicy-code](https://github.com/cicy-ai/cicy-code). All skills are plain Node.js source — no compiled binaries, no opaque blobs. Read every line before installing.

- **Registry**: <https://skills.cicy-ai.com>
- **Distribution**: GitHub Releases on this repo
- **Installer**: built into `cicy-code` — run `cicy-code skill --help`

---

## 修改 skill 并发布

```bash
# 1. 改代码
$EDITOR skills/<name>/bin/<name>

# 2. 改 manifest.json — 升版本号 (必须，否则 registry 会因 sha256 相同而幂等跳过)
# "version": "1.0.0"  →  "1.0.1"

# 3. 验证
node tools/validate-skill.js skills/<name>

# 4. 一键发布（改完版本号后直接跑）
name=<name>
version=$(jq -r .version skills/$name/manifest.json)
ADMIN_TOKEN=$(jq -r .admin_token ~/cicy-ai/db/skills-registry-admin.json)

node tools/pack-skill.js skills/$name
git add skills/$name && git commit -m "bump $name to $version" && git push origin main
git tag $name-v$version && git push origin $name-v$version
gh release create $name-v$version dist/$name-$version.zip \
  --target main --title "$name-v$version" --repo cicy-ai/cicy-skills
ADMIN_TOKEN=$ADMIN_TOKEN node tools/publish.js skills/$name $ADMIN_TOKEN
```

### 各步骤说明

| 步骤 | 作用 |
|------|------|
| `pack-skill.js` | 打包成 `dist/<name>-<version>.zip` + 计算 sha256 |
| `git tag` + `push` | 在 GitHub 上打版本标签 |
| `gh release create` | 创建 GitHub Release 并上传 zip（Worker 把它作为下载源） |
| `publish.js` | 把 manifest + `download_url` 注册到 `skills.cicy-ai.com` KV 索引 |

> `publish.js` 发布前会 HEAD 验证 `download_url` 可访问，所以 **GitHub Release 必须在 publish 之前创建**。

---

## 添加新 skill

```bash
# 1. 从模板复制
cp -r templates/skill-template skills/<name>

# 2. 填写 manifest.json — 重点字段:
#    name / version / title / description / category / author / entry
#    tools[] — 结构化工具列表，UI 里会渲染成可点击的 "→ Agent" 按钮

# 3. 写 bin/<name>  (Node.js, #!/usr/bin/env node)
#    如果是 Python 脚本，写一个 Node wrapper:
#    import { spawnSync } from 'node:child_process';
#    spawnSync('python3', [join(dir, '<name>.py'), ...process.argv.slice(2)], { stdio: 'inherit' });

# 4. 写 SKILL.md — agent 指令 (frontmatter name/description + 用法)
# 5. 写 references/help.md 和 references/tools.md

# 6. 验证 + 测试
node tools/validate-skill.js skills/<name>
./skills/<name>/bin/<name> --help

# 7. 发布（同"修改 skill"步骤 4-7）
```

### manifest.json 关键字段

```jsonc
{
  "name": "my-skill",       // 唯一标识，等于目录名
  "version": "1.0.0",       // 每次发布必须升版本
  "title": "My Skill",
  "description": "...",     // 英文，≤200 字符
  "category": "cloud",      // cloud / dev / network / productivity / system
  "author": "cicy-ai",
  "license": "MIT",
  "runtime": { "node": ">=18" },
  "entry": "bin/my-skill",
  "i18n": {
    "zh-CN": { "title": "我的 Skill", "description": "中文描述" }
  },
  "tools": [
    {
      "name": "my-skill",
      "example": "my-skill --option value",
      "description": "What this tool does"
      // prompt 字段已废弃，UI 自动用 i18n 模板生成提示词
    }
  ]
}
```

---

## 删除 skill

```bash
# 1. Yank（下架）registry 里的所有版本
ADMIN_TOKEN=$(jq -r .admin_token ~/cicy-ai/db/skills-registry-admin.json)

# 获取所有版本
curl -s "https://skills.cicy-ai.com/v1/skills/<name>/versions" \
  | python3 -c "import sys,json; [print(v['version']) for v in json.load(sys.stdin)['data']['versions']]"

# 逐版本 yank
curl -X DELETE "https://skills.cicy-ai.com/v1/admin/skills/<name>/1.0.0" \
     -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. 删除源码
rm -rf skills/<name>/

# 3. 提交
git add skills/<name>/
git commit -m "chore: remove <name> skill"
git push origin main
```

> Yank 只是从 list API 中隐藏该版本，不会真正删除 GitHub Release 资产（用户仍可直接用 URL 下载已安装的版本）。

---

## 目录结构

```
skills/<name>/
├── manifest.json          # 元数据（必需）
├── SKILL.md               # agent 指令（必需）
├── README.md              # 人类可读说明（必需）
├── bin/<name>             # #!/usr/bin/env node 入口（必需）
├── references/
│   ├── help.md            # 命令参考
│   └── tools.md           # 端点 / 环境变量
└── package.json           # 仅在需要 npm 依赖时添加
```

## 用户安装

```bash
cicy-code skill list                  # 查看所有可用 skill
cicy-code skill install <name>        # 安装
cicy-code skill update <name>         # 更新到最新版
cicy-code skill remove <name>         # 卸载
```

## License

MIT — 每个 skill 在 `manifest.json` 里声明自己的 license。

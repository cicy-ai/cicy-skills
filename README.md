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

# 4. 测试（发布前必须通过）
node tools/test-skill.js skills/<name>

# 5. 发布：提交 + 推 tag。推 tag 触发 GitHub Action (.github/workflows/publish.yml)，
#    它在 runner 上一次性 pack → 建/更新 Release → 注册 registry，三者用同一份
#    产物，保证 GitHub asset 的 sha256 与 registry 记录一致。
name=<name>
version=$(jq -r .version skills/$name/manifest.json)
git add skills/$name && git commit -m "bump $name to $version" && git push origin main
git tag $name-v$version && git push origin $name-v$version

# ⚠️ 不要再手动跑 `node tools/publish.js`！你本机 pack 的 zip 与 runner 的字节不同
#    （zip 版本差异），手动注册会让 registry 的 sha256 与 Action 上传的 asset 冲突，
#    安装时报 "sha256 mismatch"。发布唯一入口 = 推 tag。
#    重跑某个已 tag 的版本：  gh workflow run publish.yml -f tag=$name-v$version
#    ⚠️ workflow_dispatch 只在 Register 步骤之前挂掉时才能用（网络抖动、5xx）。
#       一旦 registry 已经接住某个 (name, version) 的 sha 后又出现 sha 漂移
#       (asset 被覆盖、或历史上跑过手动 publish.js)，再 dispatch 会被
#       registry 以 409 CONFLICT 拒绝——(name, version) 是 immutable，必须
#       bump 一个新版本号重发。修这种漂移的工作流：
#         1. 升 manifest.version → 新 patch 号 (源码无变化也得升)
#         2. 走上面正常的 commit + tag + push 流程
```

### 各步骤说明

| 步骤 | 作用 |
|------|------|
| `validate-skill.js` | 校验 manifest.json 结构、必需文件是否存在 |
| `test-skill.js` | **运行 test case，发布前必须通过** |
| `pack-skill.js` | 打包成 `dist/<name>-<version>.zip` |
| `publish.js` | **由 Action 调用（不要手动跑）**：上传 zip → 下载真实 asset 算 sha256 → 注册 registry |

> 发布全部由 GitHub Action 完成（pack + Release + registry 都用 runner 上同一份产物，
> 所以 GitHub asset 的 sha256 一定等于 registry 记录）。**前提**：repo 配置了 secret
> `SKILLS_REGISTRY_ADMIN_TOKEN`（= registry 的 admin token），否则 Register 步骤会跳过、
> registry 不更新。**切勿在本机手动 `publish.js`**——本机 zip 与 runner 字节不同会造成
> registry/asset 的 sha256 冲突（安装报 mismatch）。

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
node tools/test-skill.js skills/<name>
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

## 删除 / 下架 skill（从线上 market 拿掉）

> **`git rm skills/<name>/` 不会把它从 market 下架。** 发布是单向只增
> （tag → CI → POST registry），删 repo 目录不触发任何反向操作。registry 是
> 独立存储，每个 `(name, version)` 发布后永久驻留,必须**显式 yank** 才会从
> market（`skill list` / 安装页）消失。删了 repo 却没 yank = 线上残留 ghost skill。

下架用 `tools/yank.js`（publish.js 的逆操作，省去手搓 curl 循环）。admin token 在本机
`~/cicy-ai/db/skills-registry-admin.json` 的 `admin_token`，**读进 env、别贴到命令行**：

```bash
TOKEN_FILE=~/cicy-ai/db/skills-registry-admin.json

# 下架某个 skill 的全部版本 → 从 market 彻底消失（最常用）
ADMIN_TOKEN=$(jq -r .admin_token $TOKEN_FILE) node tools/yank.js <name> --all

# 只下架单个版本（其余版本还在，latest 会回落到次高的非 yanked 版本）
ADMIN_TOKEN=$(jq -r .admin_token $TOKEN_FILE) node tools/yank.js <name> <version>

# 下架后再删源码（顺序无所谓，但 yank 必须做，否则 market 残留）
git rm -r skills/<name>/ && git commit -m "chore: remove <name> skill" && git push origin main
```

机制要点：

- yank 是**软标记**（`yanked: true`），不是物理删除：版本仍在 KV 里，但不再当
  `latest`、不进 catalog、`download` 返回 **410 Gone**；GitHub Release 资产也还在
  （知道 URL 的人仍能直接下到已发布的 zip）。
- 要让 skill 从 market **彻底消失，必须 yank 它的每一个版本**（`--all` 一次搞定）。
  只 yank latest，`latest` 会自动回落到次高的非 yanked 版本，skill 继续显示。
- **可逆**：重新 publish 同一个 `(name, version)` 即清除 yank 标记、复活。
- **没有公开/用户级下架命令**——只有这条 admin 路径。`cicy-code skill remove` 是
  本地卸载、`skill registry remove` 删的是源列表，都**不动 registry**。
- 转**私有**：把 skill 目录移到 `~/cicy-ai/skills/private/<name>` 保留本地副本，
  再 `yank --all` 从公开 market 拿掉即可。

| 工具 | 作用 |
|------|------|
| `yank.js` | **手动跑**：拉版本列表 → 逐个 `DELETE /v1/admin/skills/:name/:version` → 校验 |

> yank 直接打 registry，不碰 GitHub asset，所以没有 publish 那种 sha 漂移问题，
> 本机手动跑是安全的（与 publish.js 不同）。也可用 GitHub Action 手动触发
> （`.github/workflows/yank.yml`，走 CI 的 admin secret、留审计、不用碰本机 token）。

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

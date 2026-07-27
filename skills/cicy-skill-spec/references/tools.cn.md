# cicy-skill-spec — 布局、环境、相关命令

## 安装目录布局（由来源决定）

```
~/cicy-ai/skills/
├── <name>/               公共  — skills.cicy-ai.com
├── private/<name>/       私有 — 您自己的本地注册表（localhost/127.0.0.1）
└── team/<team>/<name>/   团队 — 另一个团队的私有注册表
```

## 环境

| 变量 | 含义 |
|-----|---------|
| `CICY_SKILLS_ROOT` | 覆盖 `~/cicy-ai/skills`（技能安装位置） |
| `CICY_SKILLS_REGISTRY` | 单一来源覆盖（忽略 registries.json） |
| `CICY_SKILLS_REGISTRY_TOKEN` | 用于覆盖注册表的 Bearer 令牌 |

## 相关 cicy-code 命令

| 命令 | 用途 |
|---------|---------|
| `cicy-code skill registry serve` | 在此机器上托管私有注册表 |
| `cicy-code skill registry publish <dir>` | 将技能目录发布到本地注册表 |
| `cicy-code skill registry add <url> --name <t> --token <tok>` | 将团队注册表添加为客户端源 |
| `cicy-code skill registry sources` | 列出已配置的源 |
| `cicy-code skill install <name>` / `<team>/<name>` | 安装（根据上述布局落地） |

## 状态文件

| 文件 | 包含内容 |
|------|-------|
| `~/cicy-ai/registries.json` | 客户端源列表（名称/URL/令牌），权限 `0600` |
| `~/cicy-ai/local-registry.json` | 主机配置（启用/端口/目录/令牌），权限 `0600` |
| `~/cicy-ai/skills/installed.json` | 已安装记录（包含 `install_dir`） |
| `~/cicy-registry-data/` | 托管注册表的默认数据目录 |

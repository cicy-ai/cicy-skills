# Skills

`cicy-skills` 仓库统一管理本机 CLI 工具。技能源文件在 `~/projects/cicy-skills/legacy/skills/`，CLI 入口在 `~/projects/cicy-skills/bin/`，全局软链接在 `~/.local/bin/`。

## 目录结构

```
~/projects/cicy-skills/
├── bin/              ← 所有本机 CLI 入口
├── legacy/skills/    ← skill 源文件，`cicy-skills list` 直接扫描这里
├── providers/        ← 外部 provider（如 google-node）
├── docker/           ← Docker 测试环境
├── dist/             ← 本地构建产物
├── Makefile
└── README.md
```

## 使用

### 安装本机 CLI
```bash
make install-local-cli
```

这会：

- 构建 `dist/` 二进制
- 更新 `~/projects/cicy-skills/bin/`
- 同步全局软链接到 `~/.local/bin/`

### 查看当前技能
```bash
cicy-skills list
```

### 安装 Codex allow list skill
```bash
cicy-skills agent list codex
cicy-skills agent install codex all
```

当前 Codex allow list 只包括 `google` 和 `cf-tunnel`。

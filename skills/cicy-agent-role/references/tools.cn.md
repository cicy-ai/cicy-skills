# 路径与文件

默认模板根目录：

```text
~/cicy-ai/memory/agents
```

每个角色包含四个必需文件：

- `meta.yaml`：profile、工具、显示名称和开场白。
- `role.md`：英文人设、职责、边界和行为。
- `role.zh.md`：与英文语义一致的中文角色说明。
- `system.md`：该角色共用的系统运行基座。

通过 `--root` 或 `CICY_AGENT_ROLE_ROOT` 更改根目录。`create` 默认拒绝覆盖；检查旧模板后才能使用 `--force`。

市场安装的角色还包含 `.cicy-role.json` 和 `.cicy-role/base/<version>/`，用于记录来源、哈希和安全更新。CiCy 实际消费的角色契约仍然只有上面的四个文件。

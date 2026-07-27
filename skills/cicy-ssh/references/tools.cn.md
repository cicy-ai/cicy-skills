# cicy-ssh — 工具

## 功能说明

以读取和列表查看为主。编辑操作仅以最小化块进行追加，从不直接重写原文件。连接功能委托给系统原生的 `ssh` 命令处理。

## 涉及文件

| 操作   | 路径             | 权限模式 | 触发条件     |
|--------|------------------|----------|--------------|
| 读取   | `~/.ssh/config`  | —        | 始终执行     |
| 追加   | `~/.ssh/config`  | 0600     | 执行 `add`   |
| 创建目录 | `~/.ssh/`      | 0700     | 执行 `add`（如不存在时） |

`list`、`show`、`resolve`、`exec` 命令均为 **只读操作**。

## 解析器

手工实现的 `Host` 块解析器：

- 按 `^Host <patterns>$` 模式分割，捕获内容直到下一个 `Host` 行
- 每个键首次出现时生效（遵循 `ssh_config(5)` 规范）
- 通配符主机（`Host *`）在 `list` 摘要中会被跳过
- `Include` 指令不会展开解析——本工具仅检查顶层配置文件

若需获取完整生效配置，请使用 `cicy-ssh resolve <别名>`，该命令底层调用 `ssh -G`（会遵循 `Include` 指令）。

## JSON输出格式

`list --json`：
```json
{ "ok": true, "data": { "config": "/home/u/.ssh/config", "hosts": [
  { "alias": "my-box", "hostname": "1.2.3.4", "user": "root", "port": "22", "identity": "", "proxyjump": "" }
]}}
```

`show --json`：
```json
{ "ok": true, "data": { "alias": "my-box", "fields": { "hostname": "1.2.3.4", ... }, "raw": "Host my-box\n  HostName ..." } }
```

`resolve --json` 返回完整的 `ssh -G` 解析键值映射。

## 使用要点

- 猜测别名前务必先执行 `cicy-ssh list`
- 编辑配置前先用 `cicy-ssh show <别名>` 查看精确行内容
- `cicy-ssh add` 仅支持追加操作；重命名或删除请手动编辑文件
- 交互式SSH连接请**直接调用 `ssh` 命令**——`exec` 不会分配终端会话

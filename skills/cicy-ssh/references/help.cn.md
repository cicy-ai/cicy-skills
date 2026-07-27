# cicy-ssh — 帮助

## 命令

```
cicy-ssh list [--short] [--json]              列出所有主机条目
cicy-ssh show <别名> [--json]                 显示一个主机配置块（原始与解析后）
cicy-ssh add <别名> <主机名>                  添加一个最简主机配置块
       [--user 用户] [--port 端口]
       [--identity 密钥文件] [--jump 跳板机]
cicy-ssh resolve <别名> [--json]             ssh -G <别名>
cicy-ssh exec <别名> '<命令>'                 ssh <别名> '<命令>'（非交互式）
cicy-ssh --help / -h / help                   打印此帮助信息
```

进行真正的交互式会话：

```
ssh <别名>
ssh <别名> '<命令>'
ssh -J <跳板机> <别名>
scp <别名>:/路径 ./本地/
rsync -av ./本地/ <别名>:/远程/
```

## 环境变量

- `CICY_SSH_CONFIG` — 覆盖配置文件路径（默认为 `~/.ssh/config`）

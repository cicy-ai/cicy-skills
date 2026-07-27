# cicy-mihomo — 工具

## 功能说明

mihomo 的进程管理器 + 精简控制器 API 客户端 + YAML 编辑器，用于处理其 `listeners:`、`proxy-groups:`、`rules:` 配置块（支持按 Chrome 配置文件划分流量）。

## 涉及文件

| 操作   | 路径                                       | 权限 | 触发时机                       |
|--------|--------------------------------------------|------|--------------------------------|
| 写入   | `~/.local/bin/mihomo`                      | 0755 | `install`                      |
| 写入   | `~/cicy-ai/db/mihomo.yaml`                 | 0600 | `gen-config`、`add-chrome-profile`、`remove-chrome-profile`、`addProxy`、`addGroup`、`addUser` |
| 读取   | `~/cicy-ai/db/mihomo.yaml`                 | —    | `show-config`、`listeners`     |
| 写入   | `~/.local/state/cicy-skills/mihomo/pid`    | 0644 | `start`                        |
| 追加   | `~/logs/mihomo.log`                        | —    | `start`                        |

## 进程管理

- `start` — `spawn(BINARY, ['-f', CONFIG], { detached:true, stdio:['ignore', logFD, logFD] })` 随后写入 PID 文件。
- `stop`  — `process.kill(pid, 'SIGTERM')`，等待最多 5 秒，然后发送 SIGKILL。
- `status` — 通过 `process.kill(pid, 0)` 检查 PID 是否存活；若存活，则向控制器发送 GET `/version` 请求获取版本字符串。

## 控制器 API

- `reload`: 向 `PUT http://127.0.0.1:19001/configs?force=true` 发送请求，体部为 `{ "path": "<config>" }`。
- `test`:   通过 `GET /proxies` 枚举节点，然后对每个节点执行 `GET /proxies/<node>/delay?url=<probe>&timeout=3000`。

探测 URL 包括：`anthropic`、`google`、`github`、`cf`。

## listeners（只读）

```
cicy-mihomo listeners
```
解析 YAML 文件并输出：

```
LISTENER NAME              PORT   TYPE   LISTEN          → IN-NAME GROUP
chrome-profile-1           20001  mixed  127.0.0.1       → chrome-profile-1-group
chrome-profile-2           20002  mixed  127.0.0.1       → chrome-profile-2-group
```

`--json` 参数返回 `{ base_mixed_port, listeners[], in_name_rules[], proxy_groups[] }` 格式。

## add-chrome-profile（YAML 变更）

```
cicy-mihomo add-chrome-profile <name> [--port N] [--upstream G] [--listen ADDR]
```
1. 选择端口 — 显式指定 `--port` 或使用未占用的最小端口（≥ 20001）。
2. 在 `listeners:` 下追加：
   ```yaml
   - name: <name>
     type: mixed
     port: <port>
     listen: <listen|127.0.0.1>
   ```
3. 在 `proxy-groups:` 下追加：
   ```yaml
   - name: <name>-group
     type: select
     proxies:
       - <upstream|DIRECT>
   ```
4. 在 `rules:` 顶部插入：
   ```yaml
   - IN-NAME,<name>,<name>-group
   ```

验证规则（冲突时退出码 4）：
- 监听器名称唯一性
- 代理组名称唯一性
- 端口未被其他监听器占用

名称须匹配 `^[a-zA-Z][\w-]*$`（否则退出码 2）。

## remove-chrome-profile

移除匹配的监听器条目、`<name>-group` 代理组条目以及所有 `IN-NAME,<name>,...` 规则行。规则行操作幂等；若配置文件中完全不存在该配置文件，退出码 4。

## addProxy（别名：add-proxy）

```
cicy-mihomo addProxy name=<id> type=<adapter> server=<host> port=<n> [k=v ...] \
                     [--group <group>|--no-group]
```
在顶级 `proxies:` 键下追加节点（规范块格式，优先显示 `name`/`type`，其余键值对按参数顺序排列），并将节点名称添加到代理组的 `proxies:` 选择列表中 — 默认为 `default_proxy_group`，除非使用 `--group <other>` 或 `--no-group`。仅支持扁平键值对；嵌套适配器选项（`ws-opts` 等）不在本工具范围内。

- 除 `direct` 类型外，所有类型必须提供 `server=`/`port=`（否则退出码 2）
- 节点名称在 `proxies:` 下须唯一（否则退出码 4）；代理组必须已存在（否则退出码 4）
- 数字 / `true` / `false` 保持原生 YAML 标量格式；其余值使用单引号包裹
- 敏感字段（`password`、`uuid`、`token`、`psk`、`private-key` 等）在标准输出/`--json` 输出中显示为 `***` — 但字面量 `<PLACEHOLDER>` 值会原样打印，以便用户知晓需替换
- 建议使用占位符凭据（如 `password='<YOUR_PASSWORD_HERE>'`），由用户后续在编辑器中替换真实密钥

操作后建议执行 `cicy-mihomo reload`。

## addGroup（别名：add-group）

```
cicy-mihomo addGroup <name> <member1> [member2 ...]
```
在 `proxy-groups:` 下创建或更新 `select` 类型代理组 — 同名时覆盖现有条目。成员可为代理节点、其他代理组或 `DIRECT`/`REJECT`/`PASS`；支持逗号和空格分隔。未知成员退出码 4；自引用/重复成员退出码 2。操作后建议执行 `cicy-mihomo reload`。

## addUser（别名：add-user）

```
cicy-momo addUser <username> <target> [<password>]
```
一次性更新用户配置的两部分：

1. `authentication:` — `- "<username>:<password>"`（替换该用户的现有条目；若内联 `authentication: []` 为空则会开启）。未指定 `<password>` 时会生成随机密码并**仅打印一次**；用户提供的密码不会回显（显示为 `***`）。
2. `rules:` — 将 `IN-USER,<username>,<target>` 插入**在**首个 `IN-USER-PREFIX`（或 `MATCH`）行**之上**，确保特定规则优先匹配；任何已存在的 `IN-USER,<username>,…` 行将被移除。

`<target>` 必须是已存在的代理、代理组或 `DIRECT`/`REJECT`（否则退出码 4）。操作后建议执行 `cicy-mihomo reload`。

## 配置说明

| 路径                       | 权限 | 敏感字段             |
|----------------------------|------|----------------------|
| `~/cicy-ai/db/mihomo.yaml` | 0600 | （YAML 可能包含代理密码；视为敏感数据） |

## 默认约定（模板）

- `mixed-port: 9001`（基础认证端口 — 适用 IN-USER 规则）
- `external-controller: 127.0.0.1:19001`
- `skip-auth-prefixes: [127.0.0.1/32, ::1/128]` — 本地 Chrome / curl 在基础端口跳过认证
- `IN-USER-PREFIX,w-,default_proxy_group` — 所有 `w-*` 用户通过默认代理组路由；通过添加 `IN-USER,<user>,<target>` 规则**置于此行之上**可固定特定工作者
- 基于 Chrome 配置文件的监听器位于 `20001+` 端口（无认证），由 `IN-NAME` 规则优先路由
- `default_proxy_group` 为 `select` 类型代理组；通过 `PUT /proxies/default_proxy_group` 切换活跃节点

## 规则优先级警告

`IN-NAME` 规则**必须**出现在所有 `IN-USER` / `IN-USER-PREFIX` 规则**之前**。通过命名监听器进入的连接永远不会触达其下方的认证用户规则。因此 `add-chrome-profile` 始终将新 `IN-NAME` 行插入 `rules:` 顶部。

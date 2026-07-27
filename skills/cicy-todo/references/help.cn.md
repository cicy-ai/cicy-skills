# cicy-todo — 帮助

## 概要

```
cicy-todo <子命令> [参数] [--pane <w-xxxxx>] [--json]
```

所有待办事项存储在**主面板**工作区下的单一存储中
（`<master-ws>/.cicy/todos.yaml`）。每个待办事项都标有
其所属工作节点的 `pane_id`。

- **工作节点**（`X_AGENT_SHORT_ID=w-xxxxx`，非 `w-1001`）仅能查看和
  修改自己的待办事项。服务器无论CLI参数如何都会强制执行此规则。
- **主面板**（`w-1001`）默认可查看所有待办事项；传递
  `--pane <w-xxxxx>` 可将命令范围限定到某个工作节点，或代该节点添加待办事项。

## 子命令

| 子命令     | 用法                                                                 |
|------------|----------------------------------------------------------------------|
| `list`     | `cicy-todo list [--status=todo\|test\|done\|dropped] [-q <关键字>] [--all] [--pane <w-xxxxx>]` |
| `add`      | `cicy-todo add "<标题>" [--body <简要说明> \| --body-file <文件路径\|->] [--pane <w-xxxxx>]` |
| `show`     | `cicy-todo show <id前缀>` — 完整打印简要说明                            |
| `test`     | `cicy-todo test <id>`    → 状态=`test`（编码完成，待审核）               |
| `done`     | `cicy-todo done <id>`    → 状态=`done`                                 |
| `drop`     | `cicy-todo drop <id>`    → 状态=`dropped`                              |
| `back`     | `cicy-todo back <id>`    → 状态=`todo`                                 |
| `edit`     | `cicy-todo edit <id> "<新标题>"`                                        |
| `rm`       | `cicy-todo rm <id>`                                                    |

## 引用待办事项

每个待办事项都有一个稳定的、自动递增的整数 **id**（即
`cicy-todo list` 中的 `ID` 列）。当待办事项完成或丢弃时，此ID不会改变，因此
`show / test / done / drop / back / edit / rm` 命令应使用此形式：

| 形式            | 含义                                                                      |
|-----------------|--------------------------------------------------------------------------|
| `N`             | 稳定的待办事项id（即 `ID` 列打印的值，也是UI显示的值）。首选形式——状态变更后依然有效。仅当没有id为 `N` 的待办时才回退到位置引用。 |
| `#N`            | **当前视图**（状态为 `todo`/`test`，按 `created_at` 升序排列）中的显式位置索引。当活动集合变化时会改变，因此建议使用裸id。 |
| `<id前缀>`      | id的前几个字符（目前id较短，很少需要）。前缀不明确时退出码为4。          |

`--pane` 参数仅限主面板使用。从工作节点面板执行时退出码为2。

## 示例

```bash
# 从任意工作节点（例如 w-10025）执行——仅能看到自己的待办事项。
cicy-todo                         # 列出自己的活动待办事项（显示ID列）
cicy-todo --json                  # JSON输出
cicy-todo list --all              # 包含已完成/已丢弃的项目
cicy-todo list --status=done
cicy-todo list -q "发布"          # 标题或简要说明包含"发布"

cicy-todo add "迁移cf-tunnel技能"
cicy-todo done 7                  # 通过稳定id（ID列）
cicy-todo test #1                 # 通过当前视图中的位置引用
cicy-todo done ab                 # 通过id前缀（适用于任何状态）
```

## 简要说明（`--body`）

每个待办事项都包含**简要说明**：目标、验收标准和相关文件。
任务详情应记录在此——调度惯例是
`cicy-agent msg` 仅传递**待办id + 单行标题**，其他所有内容都保存在待办事项中。`show` 命令完整打印简要说明；`-q` 搜索其内容。

```sh
# 内联方式
cicy-todo add "修复网关双倍收费" --body "目标: ...
验收: - [ ] 测试通过"

# 从文件或通过标准输入传入——这是传递长篇markdown
# 简要说明的合理方式，无需处理shell引号问题
cicy-todo add "发布工作节点协议" --body-file brief.md
cat brief.md | cicy-todo add "发布工作节点协议" --body-file -

cicy-todo show 12                 # 完整打印简要说明
cicy-todo edit 12 --body-file -   # 替换简要说明（传递 --body "" 可清除）
```

未知标志将导致严重错误。（之前会静默接受并丢弃，这就是为什么 `--body` 似乎能工作但实际上会丢弃所有简要说明。）

```sh
# 从主面板（w-1001）执行。
cicy-todo                          # 所有工作节点的活动待办事项（显示PANE列）
cicy-todo --pane w-10025           # 限定到某个工作节点
cicy-todo --pane w-10025 add "协调交接"
cicy-todo --pane w-10025 done 12
```

## 环境变量

- `X_AGENT_SHORT_ID` — 调用者的面板id（由cicy-code tmux启动脚本设置）。同时驱动请求头和主/从判定。
- `CICY_PANE_ID`     — 当 `X_AGENT_SHORT_ID` 未设置时的回退变量。
- `X_AGENT_ID`       — 最终回退变量（完整形式，例如 `w-10029:main.0`）；面板id取自 `:` 之前的部分。使仅继承 `X_AGENT_ID` 的子代理仍能解析其面板。仅当这三个变量都未设置时，CLI才以退出码2退出。
- `CICY_API_PORT`    — 本地cicy-code端口（默认8008）。
- `CICY_API_TOKEN`   — 覆盖从 `~/cicy-ai/global.json` 读取的令牌。
- `CICY_GLOBAL_JSON` — 覆盖 `~/cicy-ai/global.json` 路径。

## 安全模型

每个工作节点的隔离是**基于信任的系统，而非安全边界**。所有
面板共享相同的 `api_token`，因此任何持有令牌的调用者都可以伪造
`X-Agent-Show-Id` 并冒充主面板。请将工作节点作用域视为
用户体验护栏，而非权限边界。

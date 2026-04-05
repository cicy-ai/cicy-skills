# AI Workers 产品方案 v1

## 一、产品愿景

一个链接，客户打开就是工作台。说需求，Agent 干活，实时看结果。

---

## 二、系统架构

### 整体架构

```
                        ┌─────────────────────────┐
                        │       MySQL (数据中心)    │
                        │  tokens / groups / apps  │
                        │  panes / qa_history      │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │   FastAPI :14444         │
                        │   统一认证中心             │
                        │   调度中心                │
                        │   数据中心                │
                        └──┬─────┬─────┬──────────┘
                           │     │     │
              ┌────────────┘     │     └────────────┐
              ▼                  ▼                   ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ ai-desktop   │   │ ttyd-proxy   │   │ tmux-app     │
    │ :6905        │   │ :6901        │   │ :6902        │
    │ 桌面 UI       │   │ 代理+认证     │   │ 终端增强 UI   │
    └──────┬───────┘   └──────┬───────┘   └──────────────┘
           │                  │
           │ iframe           │ 代理
           └──────────────────▼
                     ┌──────────────┐
                     │ ttyd 实例     │
                     │ :20xxx       │
                     │ → tmux       │
                     └──────────────┘
```

### 设计原则

1. **FastAPI 是唯一的认证中心** — 所有服务通过 FastAPI 验证 token
2. **权限在 DB** — 直接改 DB 就能调整，不需要重启任何服务
3. **缓存加速** — 各服务本地缓存权限，TTL 30 秒，可手动刷新
4. **可扩展** — 新增权限只需在 DB 加字段，不改架构
5. **可分布式** — FastAPI 是无状态的认证中心，可以水平扩展；各前端服务独立部署

---

## 三、认证体系

### 3.1 Token 设计

所有 token 存 MySQL，废弃 global.json。

**tokens 表：**

```sql
CREATE TABLE tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  token       VARCHAR(128) NOT NULL UNIQUE,
  group_id    INT          DEFAULT NULL COMMENT '绑定桌面组, null=所有',
  pane_id     VARCHAR(64)  DEFAULT NULL COMMENT '绑定pane, null=组内所有',
  perms       VARCHAR(255) NOT NULL COMMENT '逗号分隔权限',
  note        VARCHAR(255) DEFAULT NULL COMMENT '备注',
  expires_at  DATETIME     DEFAULT NULL COMMENT 'null=永不过期',
  created_at  DATETIME     DEFAULT NOW(),
  INDEX idx_token (token)
);
```

### 3.2 权限体系

| 权限 | 说明 | 控制什么 |
|------|------|----------|
| `ttyd_read` | 看终端输出 | ttyd WebSocket 只接收 |
| `ttyd_write` | 在终端打字 | ttyd WebSocket 可发送 |
| `prompt` | 发需求（文字/语音） | CentralPrompt、命令面板、语音按钮 |
| `pane_manage` | 管理 pane | 重启、删除、重命名 pane |
| `api_full` | 全部接口 | 创建 pane、管理桌面组、管理应用等 |

**权限是可扩展的。** 以后要加新权限（比如 `file_upload`、`screenshot`），只需：
1. DB 里加到 perms 字段
2. 对应接口加权限检查
3. 前端加 UI 控制

不需要改表结构，不需要改架构。

### 3.3 角色模板

| 角色 | perms | 场景 |
|------|-------|------|
| 管理员 | `ttyd_read,ttyd_write,prompt,pane_manage,api_full` | 你自己 |
| 协作者 | `ttyd_read,ttyd_write,prompt` | 能操作终端的同事 |
| 客户 | `ttyd_read,prompt` | 能看、能说需求 |
| 围观者 | `ttyd_read` | 纯看 |

### 3.4 认证流程

```
任何请求带 token
       │
       ▼
服务收到（ai-desktop / ttyd-proxy / tmux-app）
       │
       ▼
调 FastAPI GET /api/auth/verify-token?token=xxx
（本地有缓存就用缓存，30秒 TTL）
       │
       ▼
FastAPI 查 DB tokens 表
       │
       ├── 无效 / 过期 → {valid: false} → 401
       │
       └── 有效 → 返回权限信息
              │
              │  {
              │    valid: true,
              │    group_id: 5,        // 能看哪个桌面组
              │    pane_id: null,      // 能访问哪些 pane
              │    perms: ["ttyd_read", "prompt"]
              │  }
              │
              ▼
       服务按权限执行：
       - group_id 不匹配 → 403
       - pane_id 不匹配 → 403
       - 缺少所需权限 → 403
       - 通过 → 放行
```

### 3.5 缓存策略

```
各服务内存缓存: Map<token, {perms, group_id, pane_id, expires_at, cached_at}>

查询流程:
1. 缓存有 && cached_at < 30秒 → 直接用
2. 缓存没有 || 过期 → 调 FastAPI verify-token → 更新缓存
3. POST /api/auth/flush-cache → 清空 FastAPI 缓存
4. 各服务自己的缓存最多 30 秒自动过期

你改了 DB → 最多 30 秒全部生效
你调了 flush-cache → FastAPI 立即生效，各服务最多 30 秒生效
```

---

## 四、CentralPrompt 调度系统

### 4.1 定位

CentralPrompt 是用户和系统交互的唯一入口。
用户说需求 → 调度 Agent 理解并拆分 → Worker Agent 执行 → 用户看结果。

### 4.2 交互流程

```
用户打开桌面（空桌面或有预览窗口）
       │
       ▼
看到 CentralPrompt 对话框
       │
       │ "帮我做一个登录页面，要有手机号验证码"
       │ （文字输入 或 🎤 语音输入）
       ▼
ai-desktop 通过 WebSocket 发给 FastAPI
       │
       │ /ws/agent/{groupId}
       ▼
调度 Agent 处理：
       │
       ├── 理解需求，整理成结构化任务
       ├── 回复用户："好的，我来帮你做登录页面"
       │
       │ 发出 actions:
       ├── add_terminal → 桌面自动出现终端窗口
       ├── send_command → 给 Worker Agent 发任务
       ├── add_iframe → 打开预览窗口
       └── message → 回复用户进度
              │
              ▼
用户实时看到：
  - 终端里 Agent 在写代码
  - 预览窗口里页面在变化
  - 对话框里 Agent 在汇报进度
       │
       │ "颜色换成蓝色"
       ▼
继续对话，迭代需求
```

### 4.3 CentralPrompt UI

```
桌面有窗口时：CentralPrompt 缩小到底部浮动条
桌面空时：CentralPrompt 居中大显示

┌──────────────────────────────────────────┐
│                                          │
│         🤖 有什么可以帮你的？               │
│                                          │
│  ┌────────────────────────────────┐      │
│  │ 输入你的需求...          🎤 ➤  │      │
│  └────────────────────────────────┘      │
│                                          │
│  对话历史：                                │
│  👤 帮我做一个登录页面                      │
│  🤖 好的，我来创建项目...                   │
│  🤖 [正在执行] 创建终端窗口                  │
│                                          │
└──────────────────────────────────────────┘
```

### 4.4 语音集成

```
用户点 🎤
    │
    ▼
浏览器录音 → 发送到 STT 服务 (localhost:15003)
    │
    ▼
返回文字 → 填入输入框 → 自动发送
    │
    ▼
调度 Agent 处理（同文字流程）
```

### 4.5 权限控制

| 权限 | CentralPrompt 行为 |
|------|-------------------|
| 有 `prompt` | 显示输入框和语音按钮，可以发需求 |
| 无 `prompt` | 只显示对话历史（只读），不能输入 |
| 有 `api_full` | Agent 可以创建窗口、管理 pane |
| 无 `api_full` | Agent 只能在已有窗口里操作 |

---

## 五、用户体验

### 5.1 管理员（你）

```
1. 打开 desktop.cicy.de5.net（你的 master token）
2. 创建桌面组 "张三-官网项目"
3. 摆好窗口：终端 + 预览
4. 生成客户 token：
   POST /api/auth/tokens
   {group_id: 5, perms: ["ttyd_read","prompt"], note: "张三", expires_at: "2026-03-04"}
5. 发链接给客户：desktop.cicy.de5.net/?token=abc123
```

### 5.2 客户

```
1. 打开链接 desktop.cicy.de5.net/?token=abc123
2. 看到桌面，上面有终端窗口和预览窗口
3. 中央/底部有对话框
4. 输入 "帮我把首页的 banner 换成蓝色"
5. 看到 Agent 在终端里改代码
6. 预览窗口自动刷新，看到效果
7. 继续说 "字体再大一点"
8. 迭代直到满意
```

### 5.3 客户不能做的

- ❌ 在终端打字
- ❌ 创建/删除/重启窗口
- ❌ 切换到其他桌面
- ❌ 添加/删除应用
- ❌ 修改设置
- ❌ 看到其他客户的桌面

---

## 六、接口设计

### 6.1 认证接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/auth/verify-token` | 验证 token | 公开 |
| POST | `/api/auth/tokens` | 创建 token | api_full |
| GET | `/api/auth/tokens` | 列出 token | api_full |
| DELETE | `/api/auth/tokens/{id}` | 删除 token | api_full |
| POST | `/api/auth/flush-cache` | 刷新缓存 | api_full |

### 6.2 现有接口权限映射

| 接口 | 需要权限 | 额外限制 |
|------|----------|----------|
| `GET /api/health` | 无 | |
| `GET /api/tmux/panes/{pane_id}` | `ttyd_read` | pane_id 匹配 |
| `POST /api/tmux/capture_pane` | `ttyd_read` | pane_id 匹配 |
| `POST /api/tmux/send` | `prompt` | pane_id 匹配 |
| `POST /api/tmux/panes/{pane_id}/restart` | `pane_manage` | |
| `PATCH /api/tmux/panes/{pane_id}` | `pane_manage` | |
| `DELETE /api/tmux/panes/{pane_id}` | `pane_manage` | |
| `POST /api/tmux/create` | `api_full` | |
| `POST /api/tmux/clear` | `api_full` | |
| `GET /api/tmux/tree` | `api_full` | |
| `GET /api/tmux-list` | `api_full` | |
| 全部 `/api/groups/*` | `api_full` | |
| 全部 `/api/apps/*` | `api_full` | |
| 全部 `/api/ttyd/*` | `api_full` | |
| 全部 `/api/services/*` | `api_full` | |

### 6.3 WebSocket 权限

| 连接 | 需要权限 | 行为 |
|------|----------|------|
| ttyd WebSocket (终端) | `ttyd_read` | 只接收输出 |
| ttyd WebSocket (终端) | `ttyd_read` + `ttyd_write` | 双向读写 |
| /ws/agent/{groupId} | `prompt` | 可以发消息 |
| /ws/agent/{groupId} | 无 `prompt` | 只接收消息（看 Agent 回复） |

---

## 七、各项目改动清单

### 7.1 FastAPI

| 文件 | 改动 |
|------|------|
| 新建迁移脚本 | 建 tokens 表，迁移 global.json token |
| `routers/auth.py` | 新增 verify-token、token CRUD、flush-cache |
| 新建 `middleware/auth.py` | 权限校验中间件，按 perms + pane_id + group_id 拦截 |
| `main.py` | 注册新路由，移除 global.json 读取 |
| 各 router | 加权限装饰器 |

### 7.2 ttyd-proxy

| 文件 | 改动 |
|------|------|
| `server/src/index.ts` | checkToken 改调 FastAPI verify-token |
| `server/src/index.ts` | 加本地缓存（Map + TTL 30秒） |
| `server/src/index.ts` | WebSocket 代理：无 ttyd_write 时过滤客户端输入 |
| `server/src/index.ts` | pane_id 校验 |
| 删除 | global.json 挂载和读取逻辑 |

### 7.3 tmux-app

| 文件 | 改动 |
|------|------|
| `frontend/src/SinglePaneApp.tsx` | 启动时调 verify-token 获取 perms |
| `frontend/src/SinglePaneApp.tsx` | 无 `prompt` → 隐藏命令面板、语音按钮 |
| `frontend/src/SinglePaneApp.tsx` | 无 `pane_manage` → 隐藏重启、删除、编辑按钮 |

### 7.4 ai-desktop

| 文件 | 改动 |
|------|------|
| `src/App.tsx` | 启动时调 verify-token，存 perms + group_id 到 state |
| `src/App.tsx` | group_id 不为 null → 只加载该桌面组 |
| `src/App.tsx` | 打开 CentralPrompt（取消注释 + 改造） |
| `src/components/CentralPrompt.tsx` | 改造：对接 Agent WebSocket、加语音、加对话历史 |
| `src/components/TopBar.tsx` | 无 `api_full` → 隐藏创建/删除按钮 |
| `src/components/TopBar.tsx` | 无 `pane_manage` → 隐藏管理按钮 |
| `src/components/Window.tsx` | 无 `pane_manage` → 隐藏关闭/重启按钮 |

### 7.5 ttyd

**不改。**

---

## 八、实施顺序

```
阶段一：认证基础（必须先做）
  1. FastAPI 建 tokens 表 + 迁移 master token
  2. FastAPI verify-token 接口 + 缓存
  3. FastAPI token CRUD 接口 + flush-cache
  4. FastAPI 中间件按 perms 拦截

阶段二：各服务接入（可并行）
  5a. ttyd-proxy 改用 verify-token + WebSocket 权限过滤
  5b. tmux-app 根据 perms 控制 UI
  5c. ai-desktop 根据 perms + group_id 控制 UI

阶段三：CentralPrompt（阶段二之后）
  6. CentralPrompt 改造：对接 Agent WebSocket
  7. CentralPrompt 加语音输入（STT 集成）
  8. CentralPrompt 对话历史

阶段四：测试 + 清理
  9. 全链路测试（各种权限组合）
  10. 废弃 global.json
```

---

## 九、扩展性

### 加新权限

```
1. DB: 在 perms 字段加新值（比如 "file_upload"）
2. 后端: 对应接口加权限检查
3. 前端: 对应 UI 加条件渲染
不改表结构，不改架构。
```

### 加新服务

```
1. 新服务启动时调 FastAPI verify-token 验证
2. 按返回的 perms 控制行为
FastAPI 是唯一认证中心，新服务只需要会调一个接口。
```

### 分布式部署

```
FastAPI 无状态（缓存在内存，可以用 Redis 替代）
各前端服务独立容器，可以分机器部署
ttyd-proxy 可以多实例 + 负载均衡
所有数据在 MySQL，单一数据源
```

---

## 十、测试用例

```bash
# 1. 创建管理员 token
bash ~/skills/mysql-exec.sh "INSERT INTO tokens (token, perms, note) VALUES ('master_xxx', 'ttyd_read,ttyd_write,prompt,pane_manage,api_full', 'master');"

# 2. 创建客户 token
curl -X POST https://g-fast-api.cicy.de5.net/api/auth/tokens \
  -H "Authorization: Bearer master_xxx" \
  -d '{"group_id":5, "perms":["ttyd_read","prompt"], "note":"张三", "expires_at":"2026-03-04"}'

# 3. 客户打开桌面
# https://desktop.cicy.de5.net/?token=返回的token

# 4. 验证权限
# ✅ 客户能看终端
# ✅ 客户能发 prompt / 语音
# ❌ 客户不能在终端打字
# ❌ 客户不能关闭窗口
# ❌ 客户不能切换桌面
# ❌ 客户不能创建 pane

# 5. 动态调整权限
bash ~/skills/mysql-exec.sh "UPDATE tokens SET perms='ttyd_read' WHERE note='张三';"
# 30 秒后客户的 prompt 功能消失

# 6. 撤销访问
bash ~/skills/mysql-exec.sh "DELETE FROM tokens WHERE note='张三';"
# 30 秒后客户被踢出
```

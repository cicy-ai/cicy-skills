# AI Workers 项目架构

ai-workers 是一套 Web 终端桌面系统，5 个子项目协作。

---

## 一句话理解

用户打开 ai-desktop 网页 → 看到一个桌面 → 桌面上的终端窗口其实是 iframe → iframe 指向 ttyd-proxy → ttyd-proxy 把请求转发给 ttyd 进程 → ttyd 连着 tmux 终端 → 所有东西都由 FastAPI 统一管理。

---

## 架构图

```
用户浏览器
    │
    │ 访问 https://desktop.cicy.de5.net
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│  ai-desktop (React 桌面)                                      │
│  路径: ~/projects/ai-workers/ai-desktop                       │
│  域名: https://desktop.cicy.de5.net                           │
│  端口: 6905 (外部) → 3000 (容器内)                              │
│  管理: Docker Compose                                         │
│                                                              │
│  桌面上有很多窗口，每个窗口里面是一个 iframe                        │
│                                                              │
│  终端窗口的 iframe src:                                        │
│  https://ttyd-proxy.cicy.de5.net/ttyd/{pane_id}/?token=xxx   │
│                                                              │
│  应用窗口的 iframe src:                                        │
│  任意 URL (比如 https://google.com)                            │
└──────────────┬───────────────────────────────────────────────┘
               │
               │ iframe 加载终端页面
               ▼
┌──────────────────────────────────────────────────────────────┐
│  ttyd-proxy (Node.js 反向代理)                                 │
│  路径: ~/projects/ai-workers/ttyd-proxy                       │
│  域名: https://ttyd-proxy.cicy.de5.net                        │
│  端口: 6901                                                   │
│  管理: Docker Compose (host 网络模式)                           │
│                                                              │
│  做三件事:                                                     │
│  1. 收到 /ttyd/w-20065:main.0/ 请求                           │
│     → 查表得知 w-20065 对应端口 20065                           │
│     → 转发请求到 localhost:20065 (ttyd 进程)                    │
│  2. 转发时注入 tmux-app 的前端代码到 HTML 里                     │
│  3. 统一处理 token 认证                                        │
└──────┬───────────────────────────────┬───────────────────────┘
       │                               │
       │ 注入的前端代码来自这里            │ HTTP + WebSocket 转发
       ▼                               ▼
┌─────────────────────────┐  ┌─────────────────────────────────┐
│  tmux-app (React UI)     │  │  ttyd 实例 (C 程序)              │
│  路径: ~/projects/       │  │  路径: ~/projects/               │
│    ai-workers/tmux-app   │  │    ai-workers/ttyd              │
│  域名: https://ttyd-dev  │  │  编译产物: ttyd/build/ttyd       │
│    .cicy.de5.net         │  │  端口: 动态 (20065, 20073...)    │
│  端口: 6902              │  │  管理: FastAPI 自动启停           │
│  管理: Docker Compose    │  │                                 │
│                          │  │  每个 pane 一个进程:              │
│  提供:                    │  │  ttyd -W -p 20065               │
│  - 命令输入面板            │  │    -c user:{token}              │
│  - 语音输入               │  │    tmux attach -t               │
│  - 多终端视图             │  │    w-20065:main.0               │
│  - pane 管理 UI          │  │                                 │
│                          │  │  ttyd 把 tmux 终端变成           │
│  也可独立访问:             │  │  WebSocket，浏览器就能用了        │
│  ttyd-dev.cicy.de5.net   │  │                                 │
│  /ttyd/{pane_id}/        │  │         │                       │
│    ?token=xxx            │  │         │ tmux attach           │
└─────────────────────────┘  │         ▼                       │
                              │  ┌─────────────────────┐       │
                              │  │ tmux sessions        │       │
                              │  │ w-20065:main.0       │       │
                              │  │ w-20073:main.0       │       │
                              │  │ ...                  │       │
                              │  │ 真正的终端在这里       │       │
                              │  └─────────────────────┘       │
                              └─────────────────────────────────┘
                                           │
          所有东西都由 FastAPI 管理            │
                                           ▼
┌──────────────────────────────────────────────────────────────┐
│  FastAPI (Python 后端，大脑)                                    │
│  路径: ~/projects/ai-workers/fast-api                         │
│  域名: https://g-fast-api.cicy.de5.net                        │
│  端口: 14444                                                  │
│  管理: supervisorctl (服务名: fast-api)                        │
│                                                              │
│  管什么:                                                       │
│  - tmux pane 增删改查 (创建/删除/重启/重命名)                     │
│  - ttyd 进程启停 (创建 pane 时自动启动 ttyd)                     │
│  - groups 桌面组 (ai-desktop 的多桌面数据)                      │
│  - apps 应用管理 (保存用户添加的 URL)                            │
│  - auth 认证 (token 验证)                                     │
│  - WebSocket Agent (AI 远程操作桌面)                            │
│  - 数据全存 MySQL                                              │
└──────────────────────────────────────────────────────────────┘

```

---

## 速查表

| 项目 | 路径 | 域名 | 端口 | 管理方式 | 技术栈 |
|------|------|------|------|----------|--------|
| FastAPI | ~/projects/ai-workers/fast-api | https://g-fast-api.cicy.de5.net | 14444 | supervisorctl | Python + FastAPI |
| ai-desktop | ~/projects/ai-workers/ai-desktop | https://desktop.cicy.de5.net | 6905→3000 | Docker Compose | React + Vite + TS |
| ttyd-proxy | ~/projects/ai-workers/ttyd-proxy | https://ttyd-proxy.cicy.de5.net | 6901 | Docker Compose | Node.js + TS |
| tmux-app | ~/projects/ai-workers/tmux-app | https://ttyd-dev.cicy.de5.net | 6902 | Docker Compose | React + Vite + TS |
| ttyd | ~/projects/ai-workers/ttyd | 无（内部服务） | 动态 20xxx | FastAPI 管理 | C 语言 |

---

## 数据流举例

### 用户打开桌面，看到一个终端窗口

```
1. 浏览器打开 https://desktop.cicy.de5.net
2. ai-desktop 加载，调 FastAPI 获取桌面组数据
3. 桌面上显示窗口，窗口里的 iframe 指向:
   https://ttyd-proxy.cicy.de5.net/ttyd/w-20065%3Amain.0/?token=xxx
4. ttyd-proxy 收到请求:
   - 查缓存: w-20065:main.0 → 端口 20065
   - 请求 localhost:20065 获取 ttyd 的 HTML
   - 往 HTML 里注入 tmux-app 的前端代码
   - 返回给浏览器
5. 浏览器渲染终端 + tmux-app UI
6. 用户打字 → WebSocket → ttyd-proxy → ttyd → tmux → shell 执行
```

### 创建新终端

```
1. ai-desktop 调 FastAPI POST /api/tmux/create
2. FastAPI 创建 tmux session (比如 w-20074)
3. FastAPI 启动 ttyd 进程: ttyd -W -p 20074 -c user:{token} tmux attach -t w-20074:main.0
4. FastAPI 返回 pane_id=w-20074:main.0, ttyd_port=20074
5. ai-desktop 创建新窗口，iframe 指向 ttyd-proxy/ttyd/w-20074:main.0/
6. 终端就出来了
```

---

## 快速检查

```bash
check-all                    # 一键检查所有服务
ai-desktop-check             # ai-desktop
ttyd-check                   # ttyd-proxy
tmux-app-check               # tmux-app
fapi                         # FastAPI
```

---

## 注意事项

- ⚠️ 所有前端项目支持热重载，修改代码自动生效，**不要重启容器**
- ⚠️ ttyd 进程由 FastAPI 管理，**不要手动 kill**
- ⚠️ cloudflared 由系统管理，**绝对不能 kill**
- 所有服务共用同一个 token（~/global.json 中的 api_token）
- 数据持久化在 MySQL 中
- 用 `bash ~/skills/mysql-exec.sh "SQL语句"` 查数据库

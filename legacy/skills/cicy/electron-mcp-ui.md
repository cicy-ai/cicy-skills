# ElectronMcpUi Service

Electron MCP UI 应用,基于 Gemini API 的 AI Studio 应用。

## 服务信息

- **公网地址:** https://g-electron-mcp-ui.cicy.de5.net
- **端口:** 13011
- **项目路径:** ~/projects/ai-workers/ElectronMcpUi
- **管理方式:** Docker Compose

## 快速操作

### 健康检查
```bash
electron-mcp-ui-check             # 自动检查服务状态
```

### 服务控制
```bash
cd ~/projects/ai-workers/ElectronMcpUi

# 启动
sudo docker compose up -d

# 重启
sudo docker compose restart

# 停止
sudo docker compose down

# 查看状态
sudo docker compose ps
```

### 查看日志
```bash
cd ~/projects/ai-workers/ElectronMcpUi
sudo docker compose logs -f frontend
```

### 测试访问
```bash
# 公网访问
curl https://g-electron-mcp-ui.cicy.de5.net

# 本地访问
curl http://localhost:13011
```

## 技术栈

- **前端:** Node.js + Vite (支持热重载)
- **AI:** Gemini API
- **容器:** Docker Compose

## 开发模式

### 热重载支持
- 代码修改会自动更新 (Vite HMR)
- 无需重启容器,代码修改即时生效

## 配置

### 环境变量

需要在 `.env` 或 `.env.local` 中配置:
```bash
GEMINI_API_KEY=your_api_key_here
```

## 故障排查

### 服务无响应
```bash
electron-mcp-ui-check             # 自动诊断
```

### 手动重启
```bash
cd ~/projects/ai-workers/ElectronMcpUi
sudo docker compose restart
```

### 查看容器状态
```bash
cd ~/projects/ai-workers/ElectronMcpUi
sudo docker compose ps
sudo docker compose logs --tail=50
```

### 端口占用检查
```bash
ss -tlnp | grep 13011
```

### 重新构建
```bash
cd ~/projects/ai-workers/ElectronMcpUi
sudo docker compose down
sudo docker compose up --build -d
```

## 项目结构

```
~/projects/ai-workers/ElectronMcpUi/
├── src/                # 源码
├── docker-compose.yml  # Docker 配置
├── Dockerfile.dev      # 开发环境镜像
├── package.json        # 依赖配置
└── .env.example        # 环境变量示例
```

## 相关技能

- `cf-tunnel.sh` - Cloudflare 隧道管理
- `check-all` - 统一服务检查

## 注意事项

- ⚠️ **项目支持热重载 (Vite HMR),非必要不要重启容器**
- 代码修改会即时更新,无需重启
- 遇到问题优先查看日志: `cd ~/projects/ai-workers/ElectronMcpUi && sudo docker compose logs -f`
- 服务由 Docker Compose 管理
- 需要配置 `GEMINI_API_KEY` 才能正常运行
- 端口映射: 13011(外部) → 3000(容器内部)

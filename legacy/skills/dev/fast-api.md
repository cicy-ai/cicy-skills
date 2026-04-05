# Fast API Service

FastAPI 后端服务,提供 AI Workers 相关 API 接口。

## 服务信息

- **公网地址:** https://g-fast-api.cicy.de5.net
- **本地端口:** 14444
- **项目路径:** ~/projects/ai-workers/fast-api
- **管理方式:** supervisorctl
- **服务名称:** fast-api

## 快速操作

### 检查服务状态
```bash
fapi                              # 自动健康检查
sudo supervisorctl status fast-api
```

### 服务控制
```bash
sudo supervisorctl restart fast-api   # 重启
sudo supervisorctl stop fast-api      # 停止
sudo supervisorctl start fast-api     # 启动
```

### 查看日志
```bash
sudo supervisorctl tail fast-api      # 最近日志
sudo supervisorctl tail -f fast-api   # 实时日志
```

### 测试接口
```bash
# 健康检查
curl https://g-fast-api.cicy.de5.net/api/health

# 本地访问
curl http://localhost:14444/api/health
```

## API 端点

- `GET /api/health` - 健康检查
- 其他端点查看项目文档

## 故障排查

### 服务无响应
```bash
fapi                              # 自动诊断和修复
```

### 手动重启
```bash
sudo supervisorctl restart fast-api
```

### 查看详细日志
```bash
cd ~/projects/ai-workers/fast-api
tail -f logs/*.log
```

### 端口占用检查
```bash
ss -tlnp | grep 14444
```

## 开发

### 项目结构
```
~/projects/ai-workers/fast-api/
├── main.py           # 主应用
├── venv/             # 虚拟环境
└── requirements.txt  # 依赖
```

### 本地开发
```bash
cd ~/projects/ai-workers/fast-api
source venv/bin/activate
uvicorn main:app --reload --port 14444
```

## 监控

服务由 supervisor 自动管理,崩溃会自动重启。

健康检查工具 `fapi` 可以:
- ✅ 检测端口监听状态
- ✅ 检测 supervisor 进程状态
- ✅ 检测 HTTP 响应
- ✅ 自动重启异常服务
- ✅ 显示详细日志

## 健康检查工具 (fapi)

自动检查脚本: `~/skills/fast-api-check.sh`

**功能:**
- ✅ 检查端口 14444 是否监听
- ✅ 检查 supervisor 进程状态
- ✅ 检查 HTTP 响应
- ✅ 自动重启异常服务
- ✅ 显示详细日志

**使用:**
```bash
fapi                              # 运行健康检查
```

**自动化监控:**
```bash
# 添加到 crontab 每 5 分钟检查
*/5 * * * * /usr/local/bin/fapi > /dev/null 2>&1
```

## 相关技能

- `cf-tunnel.sh` - Cloudflare 隧道管理
- `svm` - 系统服务管理

## 注意事项

- ⚠️ **项目支持热重载,非必要不要重启进程**
- 代码修改会自动生效,无需重启
- 遇到问题优先查看日志: `sudo supervisorctl tail -f fast-api`
- 服务由 supervisor 管理,不要手动 kill 进程
- 本地访问需要设置 `no_proxy` 避免代理干扰

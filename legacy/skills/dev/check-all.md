# Check All Services

统一检查所有服务状态的快速工具。

## 功能

一键检查所有关键服务的运行状态:
- FastAPI (g-fast-api.cicy.de5.net)
- ttyd-proxy (ttyd-proxy.cicy.de5.net)
- Cloudflared Tunnel
- FRP Server
- Docker
- Supervisor

## 安装

```bash
chmod +x ~/skills/check-all.sh
sudo ln -sf ~/skills/check-all.sh /usr/local/bin/check-all
```

## 使用

```bash
check-all                         # 检查所有服务
```

## 输出示例

```
🔍 检查所有服务状态
====================

1️⃣  FastAPI (g-fast-api.cicy.de5.net)
   ✅ 运行中 (supervisorctl)

2️⃣  ttyd-proxy (ttyd-proxy.cicy.de5.net)
   ✅ 运行中 (docker compose)

3️⃣  Cloudflared Tunnel
   ✅ 运行中 (systemd)

4️⃣  FRP Server
   ✅ 运行中 (systemd)

5️⃣  Docker
   ✅ 运行中 (systemd)

6️⃣  Supervisor
   ✅ 运行中 (systemd)

====================
💡 详细检查命令:
   fapi          - FastAPI 详细检查
   ttyd-check    - ttyd-proxy 详细检查
```

## 详细检查

如果某个服务异常,使用对应的详细检查命令:

```bash
fapi                              # FastAPI 详细检查和修复
ttyd-check                        # ttyd-proxy 详细检查和修复
systemctl status cloudflared      # Cloudflared 状态
systemctl status frp-server       # FRP Server 状态
```

## 相关技能

- `fapi` - FastAPI 健康检查
- `ttyd-check` - ttyd-proxy 健康检查
- `cf-tunnel.sh` - Cloudflare 隧道管理

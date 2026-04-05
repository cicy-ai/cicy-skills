#!/bin/bash
# 检查所有服务状态

echo "🔍 检查所有服务状态"
echo "===================="
echo ""

# 检查 global.json 链接
if [ ! -L "/home/w3c_offical/global.json" ]; then
    echo "⚠️  global.json 链接不存在,正在创建..."
    sudo -u w3c_offical ln -s /home/w3c_offical/Private/global.json /home/w3c_offical/global.json
    if [ -L "/home/w3c_offical/global.json" ]; then
        echo "✅ global.json 链接已创建"
    else
        echo "❌ global.json 链接创建失败"
    fi
    echo ""
fi

# VNC (tigervnc)
echo "1️⃣  VNC Server (DISPLAY :1)"
if ps aux | grep -q "[X]tigervnc :1"; then
    echo "   ✅ 运行中"
else
    echo "   ❌ 未运行 - 正在启动..."
    sudo -u w3c_offical bash /home/w3c_offical/tools/vnc-start.sh > /dev/null 2>&1 &
    sleep 2
    if ps aux | grep -q "[X]tigervnc :1"; then
        echo "   ✅ 启动成功"
    else
        echo "   ❌ 启动失败"
    fi
fi
echo ""

# Electron MCP
echo "2️⃣  Electron MCP (localhost:8101)"
if ss -tlnp | grep -q ":8101 "; then
    PID_FILE="/tmp/electron-mcp-8101.pid"
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "   ✅ 运行中 (PID: $PID)"
        else
            echo "   ❌ 进程异常"
        fi
    else
        echo "   ✅ 端口监听中"
    fi
else
    echo "   ❌ 端口 8101 未监听 - 正在启动..."
    sudo rm -f /tmp/electron-mcp-8101.* > /dev/null 2>&1
    sudo -u w3c_offical bash /home/w3c_offical/projects/electron-mcp/main/skills/electron-mcp-service/electron-mcp-service.sh start > /dev/null 2>&1
    sleep 3
    if ss -tlnp | grep -q ":8101 "; then
        echo "   ✅ 启动成功"
    else
        echo "   ❌ 启动失败"
    fi
fi
echo ""

# Chrome Debugger
echo "3️⃣  Chrome Debugger (localhost:9220)"
if ss -tlnp | grep -q ":9220 "; then
    echo "   ✅ 运行中"
else
    echo "   ❌ 端口 9220 未监听"
fi
echo ""

# FastAPI
echo "4️⃣  FastAPI (g-fast-api.cicy.de5.net)"
if ss -tlnp | grep -q ":8008 "; then
    SUPERVISOR_STATUS=$(sudo supervisorctl status fast-api 2>/dev/null | grep -o "RUNNING\|STOPPED\|FATAL")
    if [ "$SUPERVISOR_STATUS" = "RUNNING" ]; then
        echo "   ✅ 运行中 (supervisorctl)"
    else
        echo "   ❌ 异常: $SUPERVISOR_STATUS"
    fi
else
    echo "   ❌ 端口 8008 未监听"
fi
echo ""

# ttyd-proxy
echo "5️⃣  ttyd-proxy (ttyd-proxy.cicy.de5.net)"
if ss -tlnp | grep -q ":6901 "; then
    DOCKER_STATUS=$(cd ~/projects/ai-workers/ttyd-proxy && sudo docker compose ps --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
    if [ "$DOCKER_STATUS" = "running" ]; then
        echo "   ✅ 运行中 (docker compose)"
    else
        echo "   ❌ Docker 容器异常"
    fi
else
    echo "   ❌ 端口 6901 未监听"
fi
echo ""

# tmux-app
echo "6️⃣  tmux-app (ttyd-dev.cicy.de5.net)"
if ss -tlnp | grep -q ":6902 "; then
    DOCKER_STATUS=$(cd ~/projects/ai-workers/tmux-app && sudo docker compose ps --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
    if [ "$DOCKER_STATUS" = "running" ]; then
        echo "   ✅ 运行中 (docker compose)"
    else
        echo "   ❌ Docker 容器异常"
    fi
else
    echo "   ❌ 端口 6902 未监听"
fi
echo ""

# ai-desktop
echo "7️⃣  ai-desktop (desktop.cicy.de5.net)"
if ss -tlnp | grep -q ":6905 "; then
    DOCKER_STATUS=$(cd ~/projects/ai-workers/ai-desktop && sudo docker compose ps --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
    if [ "$DOCKER_STATUS" = "running" ]; then
        echo "   ✅ 运行中 (docker compose)"
    else
        echo "   ❌ Docker 容器异常"
    fi
else
    echo "   ❌ 端口 6905 未监听"
fi
echo ""

# tg-bot
echo "8️⃣  tg-bot (Telegram Bot Manager)"
MANAGER_STATUS=$(sudo supervisorctl status tg-bot-manager 2>/dev/null | grep -o "RUNNING\|STOPPED\|FATAL")
BOT_COUNT=$(sudo supervisorctl status | grep "tg_bot_" | grep -c "RUNNING")
if [ "$MANAGER_STATUS" = "RUNNING" ]; then
    echo "   ✅ 运行中 (supervisorctl, $BOT_COUNT 个 Bot)"
else
    echo "   ❌ 管理器异常: $MANAGER_STATUS"
fi
echo ""

# vnc-proxy
echo "9️⃣  vnc-proxy (g-vnc.cicy.de5.net)"
if ss -tlnp | grep -q ":13446 " && ss -tlnp | grep -q ":13447 "; then
    DOCKER_STATUS=$(cd ~/projects/vnc-proxy && sudo docker compose ps --format json 2>/dev/null | jq -r 'select(.Service=="server") | .State' 2>/dev/null)
    if [ "$DOCKER_STATUS" = "running" ]; then
        echo "   ✅ 运行中 (docker compose)"
    else
        echo "   ❌ Docker 容器异常"
    fi
else
    echo "   ❌ 端口未监听"
fi
echo ""

# Cloudflared
echo "🔟 Cloudflared Tunnel"
if systemctl is-active --quiet cloudflared; then
    echo "   ✅ 运行中 (systemd)"
else
    echo "   ❌ 未运行"
fi
echo ""

# FRP Server
echo "1️⃣1️⃣  FRP Server"
if systemctl is-active --quiet frp-server; then
    echo "   ✅ systemd 运行中"
    # 检查 FRP 隧道状态
    FT_OUTPUT=$(sudo -u w3c_offical /home/w3c_offical/.local/bin/ft server-status 2>&1)
    CLIENT_COUNT=$(echo "$FT_OUTPUT" | grep "Active clients:" | awk '{print $4}')
    if [ -n "$CLIENT_COUNT" ]; then
        echo "   👥 活跃客户端: $CLIENT_COUNT 个"
    fi
    
    # 检查特定 SSH 隧道
    SSH_WIN=$(echo "$FT_OUTPUT" | grep -E "ssh_win|ssh_6032")
    SSH_MAC_AI=$(echo "$FT_OUTPUT" | grep -E "ssh_ai_mac|ssh_mac_ai")
    SSH_MAC_TON=$(echo "$FT_OUTPUT" | grep "ssh_16901")
    
    if [ -n "$SSH_WIN" ]; then
        WIN_PORT=$(echo $SSH_WIN | awk '{print $2}')
        echo "      ✅ ssh_win (6032): $WIN_PORT"
    else
        echo "      ❌ ssh_win (6032): 未连接"
    fi
    
    if [ -n "$SSH_MAC_TON" ]; then
        TON_PORT=$(echo $SSH_MAC_TON | awk '{print $2}')
        echo "      ✅ ssh_mac_ton (16901): $TON_PORT"
    else
        echo "      ❌ ssh_mac_ton (16901): 未连接"
    fi
    
    if [ -n "$SSH_MAC_AI" ]; then
        AI_PORT=$(echo $SSH_MAC_AI | awk '{print $2}')
        echo "      ✅ ssh_mac_ai (16901): $AI_PORT"
    else
        echo "      ❌ ssh_mac_ai (16901): 未连接"
    fi
else
    echo "   ❌ 未运行"
fi
echo ""

# Docker
echo "1️⃣2️⃣  Docker"
if systemctl is-active --quiet docker; then
    echo "   ✅ 运行中 (systemd)"
else
    echo "   ❌ 未运行"
fi
echo ""

# Supervisor
echo "1️⃣3️⃣  Supervisor"
if systemctl is-active --quiet supervisor; then
    echo "   ✅ 运行中 (systemd)"
else
    echo "   ❌ 未运行"
fi
echo ""

echo "===================="
echo "💡 详细检查命令:"
echo "   electron-mcp-service status - Electron MCP 详细检查"
echo "   sudo -u w3c_offical bash ~/tools/chrome.sh status - Chrome 详细检查"
echo "   fapi          - FastAPI 详细检查"
echo "   ttyd-check    - ttyd-proxy 详细检查"
echo "   tmux-app-check - tmux-app 详细检查"
echo "   ai-desktop-check - ai-desktop 详细检查"
echo "   tg-bot-check  - tg-bot 详细检查"
echo "   vnc-proxy-check - vnc-proxy 详细检查"

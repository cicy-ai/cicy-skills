#!/bin/bash
# ai-desktop 服务健康检查和管理

PROJECT_DIR="$HOME/projects/ai-workers/ai-desktop"
PORT=6905
DOMAIN="desktop.cicy.de5.net"

check_port() {
    PORT_OK=$(ss -tlnp | grep -q ":$PORT " && echo "✅" || echo "❌")
}

check_docker() {
    cd "$PROJECT_DIR"
    CONTAINER_STATUS=$(sudo docker compose ps --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
    if [ "$CONTAINER_STATUS" = "running" ]; then
        echo "✅"
    else
        echo "❌"
    fi
}

get_logs() {
    cd "$PROJECT_DIR"
    sudo docker compose logs --tail=30 web
}

restart_service() {
    echo "🔄 重启 ai-desktop 服务..."
    cd "$PROJECT_DIR"
    sudo docker compose restart
    sleep 5
}

start_service() {
    echo "🚀 启动 ai-desktop 服务..."
    cd "$PROJECT_DIR"
    sudo docker compose up -d
    sleep 5
}

# 主检查逻辑
echo "🔍 检查 ai-desktop 服务"
echo ""

check_port
DOCKER_STATUS=$(check_docker)

echo "📊 服务状态:"
echo "  Docker 容器: $DOCKER_STATUS"
echo "  端口 $PORT: $PORT_OK"
echo ""

if [ "$DOCKER_STATUS" = "❌" ]; then
    echo "⚠️  Docker 容器未运行"
    echo ""
    read -p "是否启动服务? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_service
    fi
elif [ "$PORT_OK" = "❌" ]; then
    echo "⚠️  端口未监听"
    echo ""
    echo "📋 最近日志 (最后 30 行):"
    get_logs
    echo ""
    echo "💡 提示: 项目支持热重载 (Vite HMR),代码修改会自动生效"
    echo "   建议先查看日志排查问题,非必要不要重启"
    echo ""
    read -p "确定要重启服务? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        restart_service
    fi
else
    echo "✅ 服务正常运行"
    echo ""
    echo "💡 查看实时日志: cd ~/projects/ai-workers/ai-desktop && sudo docker compose logs -f"
fi

# 最终状态
echo ""
echo "🌐 访问地址:"
echo "  公网: https://$DOMAIN"
echo "  本地: http://localhost:$PORT"
echo ""
echo "📋 管理命令:"
echo "  查看日志: cd ~/projects/ai-workers/ai-desktop && sudo docker compose logs -f"
echo "  重启: cd ~/projects/ai-workers/ai-desktop && sudo docker compose restart"
echo "  停止: cd ~/projects/ai-workers/ai-desktop && sudo docker compose down"

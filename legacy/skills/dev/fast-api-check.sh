#!/bin/bash
# FastAPI 服务健康检查和自动修复

SERVICE_NAME="fast-api"
PORT=8008
DOMAIN="g-fast-api.cicy.de5.net"
PROJECT_DIR="$HOME/projects/ai-workers/fast-api"

check_port() {
    ss -tlnp | grep -q ":$PORT " && return 0 || return 1
}

check_supervisor() {
    sudo supervisorctl status $SERVICE_NAME 2>/dev/null | grep -q RUNNING && return 0 || return 1
}

check_health() {
    local response=$(curl -s http://127.0.0.1:$PORT/api/health 2>/dev/null)
    if echo "$response" | grep -q '"status":"ok"'; then
        return 0
    else
        return 1
    fi
}

get_logs() {
    sudo supervisorctl tail $SERVICE_NAME | tail -20
}

restart_service() {
    echo "🔄 重启 FastAPI 服务 (supervisorctl)..."
    sudo supervisorctl restart $SERVICE_NAME
    sleep 3
}

# 主检查逻辑
echo "🔍 检查 $DOMAIN (localhost:$PORT)"
echo ""

if ! check_supervisor; then
    echo "❌ Supervisor 服务未运行"
    echo ""
    read -p "是否重启服务? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        restart_service
    fi
elif ! check_port; then
    echo "❌ 端口 $PORT 未监听"
    echo ""
    read -p "是否重启服务? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        restart_service
    fi
else
    if check_health; then
        echo "✅ 服务正常运行 (health check passed)"
        sudo supervisorctl status $SERVICE_NAME
    else
        echo "⚠️  服务健康检查失败"
        echo ""
        echo "📋 最近日志 (最后 30 行):"
        get_logs
        echo ""
        echo "💡 提示: 项目支持热重载,代码修改会自动生效"
        echo "   建议先查看日志排查问题,非必要不要重启"
        echo ""
        read -p "确定要重启服务? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            restart_service
        fi
    fi
fi

# 最终验证
echo ""
echo "📊 最终状态:"
if check_port && check_supervisor; then
    echo "✅ 端口监听: $PORT"
    echo "✅ Supervisor: $(sudo supervisorctl status $SERVICE_NAME)"
    echo "🌐 访问地址: https://$DOMAIN"
    echo ""
    echo "💡 查看实时日志: sudo supervisorctl tail -f $SERVICE_NAME"
else
    echo "❌ 服务异常"
    echo "📋 查看日志: sudo supervisorctl tail $SERVICE_NAME"
fi

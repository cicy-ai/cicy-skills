#!/bin/bash

echo "📁 检查项目目录"
echo "===================="

PROJECTS_DIR="/home/w3c_offical/projects"

# 定义项目列表
declare -A PROJECTS=(
    ["ai-workers"]="AI Workers 项目集合"
    ["cicy"]="Cicy 主项目"
    ["cicy-remote"]="Cicy Remote"
    ["electron-mcp"]="Electron MCP"
    ["frp-tunnel"]="FRP Tunnel"
    ["mihomo"]="Mihomo 代理"
    ["tmux-mcp"]="Tmux MCP"
    ["vnc-proxy"]="VNC Proxy"
)

count=1
for project in "${!PROJECTS[@]}"; do
    desc="${PROJECTS[$project]}"
    path="$PROJECTS_DIR/$project"
    
    if [ -d "$path" ]; then
        echo "${count}️⃣  $project - $desc"
        echo "   ✅ 存在: $path"
        
        # 检查是否有 docker-compose
        if [ -f "$path/docker-compose.yml" ]; then
            echo "   🐳 Docker Compose"
        fi
        
        # 检查是否有 package.json
        if [ -f "$path/package.json" ]; then
            echo "   📦 Node.js 项目"
        fi
        
        # 检查是否有 requirements.txt
        if [ -f "$path/requirements.txt" ]; then
            echo "   🐍 Python 项目"
        fi
        
        echo ""
    else
        echo "${count}️⃣  $project - $desc"
        echo "   ❌ 不存在: $path"
        echo ""
    fi
    
    ((count++))
done

echo "===================="
echo "💡 项目总数: ${#PROJECTS[@]}"

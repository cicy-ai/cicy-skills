#!/bin/bash
# fast-api - CiCy API CLI client
# Usage:
#   fast-api <endpoint> [json_body]    调用 API
#   fast-api --tools                   列出所有端点
set -euo pipefail

API_PORT="${API_PORT:-8008}"
API="http://127.0.0.1:$API_PORT"
TOKEN=$(jq -r '.api_token' ~/global.json 2>/dev/null || echo "")

if [ $# -eq 0 ] || [ "$1" = "-h" ]; then
  echo "Usage: fast-api <endpoint> [json_body]"
  echo "       fast-api --tools"
  exit 0
fi

if [ "$1" = "--tools" ]; then
  if [ -n "${2:-}" ]; then
    curl -sf -H "Authorization: Bearer $TOKEN" "$API$2" 2>/dev/null || echo "(no response)"
  else
    echo "GET  /api/health"
    echo "GET  /api/ping"
    echo "GET  /api/tmux/panes"
    echo "GET  /api/tmux/list"
    echo "GET  /api/tmux/tree"
    echo "GET  /api/tmux/windows"
    echo "GET  /api/tmux/status"
    echo "POST /api/tmux/send        {pane, text}"
    echo "POST /api/tmux/send-keys   {pane, keys}"
    echo "POST /api/tmux/send_wait   {pane, text, timeout, prompt_type}"
    echo "GET  /api/tmux/capture_pane?pane=<id>"
    echo "POST /api/tmux/create      {name}"
    echo "POST /api/chat/push        {pane, type, data}"
    echo "POST /api/notify           {action, file, message}"
    echo "GET  /api/auth/verify"
    echo "GET  /api/workers/queue"
  fi
  exit 0
fi

ENDPOINT="$1"
BODY="${2:-}"

if [ -n "$BODY" ]; then
  curl -sf -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" "$API$ENDPOINT" -d "$BODY"
else
  curl -sf -H "Authorization: Bearer $TOKEN" "$API$ENDPOINT"
fi
echo

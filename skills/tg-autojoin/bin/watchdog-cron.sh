#!/bin/bash
# 矩阵机内存看门狗(可选,用于 cron)。每轮每台最多回收 1 个格子(重载 = 内存清零,会话从本地存储恢复,
# 加群进度记在 tgsou 服务端,不会丢)。日志滚动保留最近 2000 行。
# 日志路径可用 TG_WATCHDOG_LOG 覆盖,默认 ~/cicy-ai/logs/tg-watchdog.log。
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || exit 1
LOG="${TG_WATCHDOG_LOG:-$HOME/cicy-ai/logs/tg-watchdog.log}"
mkdir -p "$(dirname "$LOG")"
cd "$SKILL_DIR" || exit 1
{
  echo "=== $(date '+%F %T')"
  timeout 900 ./bin/tg-autojoin watchdog all --limit 1200 2>&1
} >> "$LOG"
tail -2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"

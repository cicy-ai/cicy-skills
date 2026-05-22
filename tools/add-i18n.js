#!/usr/bin/env node
// tools/add-i18n.js — batch-inject i18n.zh-CN into every skill manifest.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills');

const TRANSLATIONS = {
  'agent-chrome': {
    title: 'Agent Chrome',
    description: '通过 cicy-desktop 控制本机 Chrome，支持多 Profile 独立代理。使用 CDP + ~/Private/chrome.json。',
  },
  'agent-code-server': {
    title: 'Agent Code Server',
    description: '通过 cicy-code 聊天推送通道向页面绑定的 :code-ext 扩展发送打开文件等指令。',
  },
  'agent-desktop': {
    title: 'Agent Desktop',
    description: '通过 WebSocket 调用已连接的 cicy-desktop (Electron) 客户端，支持截图、剪贴板、shell 执行、窗口列表、raw electronRPC 等。',
  },
  'agent-webpage': {
    title: 'Agent Webpage',
    description: '通过聊天 WebSocket 与 agent 当前页面客户端通信，执行 JS、ping、发送自定义事件并等待实际响应。',
  },
  'aliyun-cli': {
    title: 'Aliyun CLI',
    description: '阿里云官方 CLI 安装引导。仅三个子命令：install / config / status。真正的 API 调用请直接用 aliyun 命令。',
  },
  'cf': {
    title: 'Cloudflare API',
    description: '安全的 Cloudflare API 包装器。通过 cf curl 调用任意端点，不向 Agent 暴露 api_token。',
  },
  'cf-tunnel': {
    title: 'Cloudflare Tunnel',
    description: '管理本机的 Cloudflare Tunnel 路由和 DNS 记录。子命令：config / status / list / add / del。',
  },
  'cicy-agent': {
    title: 'Cicy Agent (tmux)',
    description: '通过 cicy-code /api/tmux/* 端点操作 tmux 面板和窗口（列表、capture、send-keys、msg、create、restart、clear），支持多节点。',
  },
  'cicy-mihomo': {
    title: 'Cicy Mihomo 代理',
    description: '管理本地 Cicy Mihomo (mihomo / clash-meta fork) 代理，包含 start/stop/reload/status/logs、节点测速和每 Chrome Profile 独立监听端口（多端口 + IN-NAME 规则）。',
  },
  'cicy-ssh': {
    title: 'Cicy SSH',
    description: '查看和管理 ~/.ssh/config 的 Host 条目。支持 list/show/add（仅追加）/resolve/exec。真正的连接请直接使用 ssh 命令。',
  },
  'cicy-todo': {
    title: 'Cicy Todo',
    description: '通过 /api/todo/* 管理每个工作区的待办事项（todo/doing/done/dropped）。支持 list/add/show/start/done/drop/back/edit/rm。',
  },
  'cping': {
    title: 'cping 网络探测',
    description: '快速检测域名或 IP 的网络延迟和可达性，支持 DNS / HTTP / TCP 多种方式。',
  },
  'email': {
    title: 'Email (Resend)',
    description: '通过 Resend 从本机发送事务邮件。子命令：config / status / send。',
  },
  'eng': {
    title: '英文校对',
    description: '一键英文语法校正包装器。将输入文本 POST 到 cicy-code 的 /api/ai/correct 并输出修正结果。',
  },
  'frp-client': {
    title: 'FRP 客户端',
    description: '管理本机 frpc 进程，支持后台启动、状态查询、代理连接、热重载和 start/stop，可通过 ssh 管理远程机器。',
  },
  'frp-server': {
    title: 'FRP 服务端',
    description: '管理本机 frps 进程，支持后台启动、状态查询、连接列表、热重载和 start/stop。',
  },
  'gemini-ask': {
    title: 'Gemini 提问',
    description: '通过 desktop_event WebSocket RPC 向已连接的 cicy-desktop 窗口发送 Gemini 提问并获取回答。',
  },
  'globalApiToken': {
    title: '全局 API Token',
    description: '查看或刷新 ~/cicy-ai/global.json 中的 api_token，Token 不会明文暴露给 Agent。',
  },
  'google': {
    title: 'Google Workspace',
    description: '本机 Google Workspace CLI：Gmail / Sheets / Drive / Calendar。OAuth 登录通过 oauth-flow.cicy-ai.com 中转（不经过 client_secret 和 token）。',
  },
  'gpt-chat': {
    title: 'GPT 多轮对话',
    description: '具有持久历史记录的多轮对话（~/Private/data/gpt-chat-history.json）。支持可选系统提示词，子命令：--clear / --system / --show-system。',
  },
  'mysql-exec': {
    title: 'MySQL 执行',
    description: '通过 docker exec 对本机 cicy-mysql 容器执行一条 SQL 语句，从 ~/projects/cicy-code/.env 读取 root 密码。',
  },
  'tg': {
    title: 'Telegram Bot',
    description: '通过 cicy-code 的 /api/tg/{send,photo} 发送 Telegram 消息或图片。Bot 配置在服务端，不在本 skill 中。',
  },
};

let ok = 0, skip = 0, fail = 0;
for (const [name, zh] of Object.entries(TRANSLATIONS)) {
  const mpath = join(ROOT, name, 'manifest.json');
  let m;
  try {
    m = JSON.parse(readFileSync(mpath, 'utf8'));
  } catch {
    console.error(`SKIP ${name}: manifest.json not found`);
    skip++;
    continue;
  }
  if (!m.i18n) m.i18n = {};
  m.i18n['zh-CN'] = zh;
  try {
    writeFileSync(mpath, JSON.stringify(m, null, 2) + '\n');
    console.log(`  ✓ ${name}`);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    fail++;
  }
}
console.log(`\ndone: ${ok} updated, ${skip} skipped, ${fail} failed`);

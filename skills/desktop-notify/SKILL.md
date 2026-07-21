---
name: desktop-notify
description: 通过 cicy-desktop 的 notify RPC 发送系统桌面通知(mac 通知中心 / Windows toast),点击可聚焦主窗口/打开 URL;旧版桌面自动回退 exec_js 网页通知。
---

# Desktop Notify

在连接的 cicy-desktop(Electron)上发送**操作系统级桌面通知**:macOS 通知中心、
Windows 右下角 toast。主进程 `Notification` 实现,窗口最小化/关闭也能弹。

## Scope

Use this skill when:

- 需要提醒用户(worker 完成回复、长任务结束、需要人工介入)且不打断当前焦点
- issue #27 类需求:替代"窗口抢焦点",改为系统通知 + 点击回到应用

不要用于:agent 间通信(用 cicy-agent msg)、微信/邮件触达(用 wechat-msg / email)。

## Quick start

```sh
desktop-notify send "w-1001 reply completed!" --body "修复登录 bug 的回复已完成"
desktop-notify send "构建完成" --url "http://127.0.0.1:8008/" --subtitle "cicy-code"
desktop-notify status          # 桌面是否在线、notify RPC 是否可用
```

## 平台说明

- **macOS**:原生通知中心;`--subtitle` 支持;首次弹出后可在系统设置里管理权限。
- **Windows**:toast 通知;依赖 AppUserModelId(cicy-desktop main.js 已设 `com.cicy.desktop`);
  `--subtitle` 被忽略。
- 点击通知 → 聚焦 CiCy Desktop 主窗口(`--no-focus` 关闭),`--url` 额外用系统浏览器打开。
- 旧版桌面(无 notify RPC)自动回退 `exec_js` 网页 Notification:能弹,但无点击聚焦。

## References

- [help.md](./references/help.md) — 完整命令参考
- [tools.md](./references/tools.md) — 依赖与桌面侧实现位置

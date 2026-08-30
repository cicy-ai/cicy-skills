# tg-login — 命令

## code <接码URL>
抓取一次接码/getcode 页面，打印设备验证码、登录时间、2fa 密码。
`--json` → `{ok,code,time,twofa,rateLimited,waitSeconds,empty}`。

## poll <接码URL>
轮询直到出现 5 位验证码；遇到 `请求过于频繁，请等待 N 秒` 自动退避
（约每分钟 1 次）。进度打到 stderr。

## parse [文件]
解析 `手机号----接码URL` 行（也支持 Tab / 逗号 / 2+ 空格分隔），文件或 stdin。
输出 `{phone, codeUrl}`。

## targets
列出已打开的 Telegram Web CDP 目标（id + 标题），配合 `--target` 指定。

## login <手机号> <接码URL> [--2fa <密码>] [--code <码>] [--target <id>]
驱动某个 profile 的 Telegram 视图完成登录：切到手机号登录、填号、请求验证码、
从 `<接码URL>` 读码（或用 `--code`）、填码，若账号有云密码再填 2FA。
出现聊天列表则退出 0，否则退出 2。步骤打到 stderr。

环境变量：`TG_CDP_HOST`(127.0.0.1)、`TG_CDP_PORT`(9221)。任意命令可加 `--json`。

## 新鲜度门控（login）
请求验证码前，`login` 先读一次接码 URL，记下当前**登录时间**作为基线，
之后只接受**登录时间严格更新**的码（即本次请求产生的那条），绝不填旧码/过期码。
若轮询窗口内没有更新的码，多半是号被 spam 限制（去 @SpamBot 申诉）。

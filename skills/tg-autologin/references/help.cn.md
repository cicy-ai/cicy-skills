# tg-autologin — 命令

    tg-autologin login <machine> <idx[,idx...]> [--phone <p> --code-url <u>] [--cooldown <sec>] [--tries <n>] [--wait <sec>] [--send-only] [--code <c> [--2fa <pw>]] [--json]

- 未提供 --phone/--code-url 时读取该 profile 已保存的手机号/接码地址;提供时会先写入再登录。
- 多个 idx 按顺序执行(同一台机器绝不并发)。
- `--wait <秒>`(默认 20):发码后先等这么久再打开接码页,通常第一次读就有码。
- `--tries <次>`(默认 12)× `--cooldown <秒>`(默认 62):读码窗口,每次间隔一个冷却,守住接码 ~1 次/分钟的限流。
- `--send-only`:只发码,停在验证码输入界面,由用户自行收码并填入(2FA 也自理)。
- `--code <码> [--2fa <密码>]`:收尾模式,直接填入用户已拿到的码(2FA 默认 `didi`),不重发。
- 接码页显示设备掉线/已离线时视为死卡,提前结束。
- 退出码:0 全部成功 · 2 用法错误 · 4 有登录失败/传输错误。

# tg-autologin — commands

    tg-autologin login <machine> <idx[,idx...]> [--phone <p> --code-url <u>] [--cooldown <sec>] [--tries <n>] [--wait <sec>] [--send-only] [--code <c> [--2fa <pw>]] [--json]

- Reads the profile's stored phone/codeUrl unless --phone/--code-url are given (which also assign them first).
- Multiple idx run sequentially (never concurrent on one machine).
- `--wait <sec>` (default 20): after sending, wait this long before opening the 接码 page, so the first read usually already has the code.
- `--tries <n>` (default 12) × `--cooldown <sec>` (default 62): read window, one read per cooldown to respect the ~1/min 接码 rate limit.
- `--send-only`: send the code and stop at the code-entry screen; the user collects the code (and handles 2FA) themselves.
- `--code <c> [--2fa <pw>]`: finish mode — type a code the user already has (2FA defaults to `didi`), no resend.
- A 接码 page reporting the device offline (掉线/已离线) is treated as a dead card and stops early.
- Exit 0 all ok · 2 usage · 4 a login failed/transport error.

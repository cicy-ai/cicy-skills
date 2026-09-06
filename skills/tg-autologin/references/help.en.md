# tg-autologin — commands

    tg-autologin login <machine> <idx[,idx...]> [--phone <p> --code-url <u>] [--cooldown <sec>] [--tries <n>] [--json]

- Reads the profile's stored phone/codeUrl unless --phone/--code-url are given (which also assign them first).
- Multiple idx run sequentially (never concurrent on one machine).
- Exit 0 all ok · 2 usage · 4 a login failed/transport error.

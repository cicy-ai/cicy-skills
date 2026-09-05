# tg-matrix — command reference (EN)

```
tg-matrix ls                 list machines currently connected to the control socket
tg-matrix open <target>      open or focus the Telegram 矩阵 panel; create it if absent
tg-matrix status <target>    report whether the panel is open / in the foreground
```

`<target>`: a machine name (`xs-1001`), a comma-separated list, or `all`.
`--json` on any command switches to machine-readable output.

## open
Idempotent. If the panel tab already exists it is brought to the foreground; if
not, a new `cicyui://panel/<runtime-id>?preset=telegram-matrix` tab is created
in profile 0's tab window and then focused. Prints, per machine, whether the
panel was `created` or `focused`, the discovered `wcid`, and whether it is now
the foreground tab.

## status
Read-only. Prints `panel OPEN` / `panel CLOSED` per machine, plus the
foreground flag, the discovered webContentsId, and the tab count.

## Exit codes
`0` ok · `2` usage error · `4` transport or main-process error (also when any
machine returns an error object).

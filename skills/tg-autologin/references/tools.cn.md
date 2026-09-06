# tg-autologin — transport & internals

Same channel as wsd: reads {base, token} from ~/cicy-ai/db/desktop-ctrl.json and
POSTs /api/rpc with a homepage-bridge wrapper that evals payloads in the Electron
main process. Cell = the browserView webContents whose session partition is
`sandbox-<idx>`. 接码 overlay uses partition `persist:sandbox-<idx>(与 cell 同 profile,走其代理)`, bounds
copied from the cell, added last (higher z), destroyed after reading.

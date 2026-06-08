# agent-electron — 实测验证记录

> 本目录在打包时被排除(`test/`),记录只进仓库、不进发布 zip。

## v1.0.6 — 2026-06-06,w-10064 实测通过 ✅

环境:darwin cicy-desktop(client `web-w-1001-mphqbqi5-aronzx`),本机经
`cicy-code skill install` 更新到 1.0.6。

- **新用法**:`open <url>` 位置参数 + `--idx` + `--client` 均 OK
- **查重纪律走通**:先 `windows` 查重(2 个 client 都报 `isElectron=true`,
  UA 均为 CiCyDesktop;darwin desktop = `web-w-1001-mphqbqi5-aronzx`),
  `app-1001.cicy-ai.com` 无在开窗 → `open` 新窗 win6
- **dispatcher webui**(https://app-1001.cicy-ai.com/)正常:
  登录页渲染 → 注入 api_token 登录 → 进 dispatcher 聊天界面
- **snapshot 验证**:左侧导航 / 顶部工具条 / 消息区(Load earlier)/
  底部 textarea / 模型选择 DeepSeek-ds-v4-pro / CMD 按钮全在,渲染正常
- `cdp` / `snapshot` / `screenshot` 均可用

同日 w-10029 实测(发版前):

- `open https://example.com`(无 idx)→ 默认 `accountIdx:1`,win4 ✓
- `open` 缺 url → usage 报错 ✓
- 原生激活:`control_electron_BrowserWindow`
  `(win.isMinimized()&&win.restore(), win.show(), win.focus())` →
  `{visible:true, focused:true}` ✓(开窗纪律的激活路径,不用 CDP)
- `open <url> --no-reuse` → 新窗 ✓

## 已知 desktop 侧问题(非本 skill,归 cicy-desktop)

- `close_window` 返回成功但窗口只隐藏不销毁(`isVisible:false` 仍在
  `get_windows` 列表里,窗口会越积越多)
- `get_windows` 不回报真实 `accountIdx`/`partition`(创建时确实用了
  `persist:sandbox-<N>`,但列表里显示 `accountIdx:0, partition:""`)
- desktop `open_window` 的 reuse 不按 URL 匹配(仅 oneWindow 模式盲拿第
  一个窗口)——所以查重必须由 agent 按 SKILL.md 纪律在客户端做

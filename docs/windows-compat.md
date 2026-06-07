# Windows 兼容性排查清单(cicy-skills × cicy-code Windows 原生路线)

> 排查人:w-10029 · 日期:2026-06-07 · 委托:w-10084
> 运行假设:skills 在「msys bash」里执行(MSYS2 @ C:\tools\msys64 提供
> bash/coreutils/grep/sed/awk/tar/unzip/curl/tail/install/nano/tmux),node 为
> **Windows 原生 node.exe**。真机验证:ssh alias `win`(Windows 11 / MSYS2)。

## 0. 真机实测结论(ssh win)

| 探测项 | 结果 |
|---|---|
| `uname -s` | `MSYS_NT-10.0-26200` |
| `$HOME`(bash -l) | `/c/Users/Administrator` ✓(与 node `os.homedir()`=`C:\Users\Administrator` 同一目录) |
| msys `/tmp` | `C:/tools/msys64/tmp` —— 与 native node `os.tmpdir()`(%TEMP%)**是两个世界**,确认 w-10084 的坑 |
| **node** | **整机 MISSING** ❌ —— 34 个 skill 全部是 `#!/usr/bin/env node`,**node.exe 必须进捆绑清单**,否则全军覆没 |
| tail/tar/unzip/curl/install/ps/nano/which/tmux | ✓ /usr/bin 都有 |
| jq | 测试机 MISSING(捆绑清单里有,按有处理) |
| **pgrep** | MISSING ❌(msys 的 ps 不是 procps,无 pgrep)|
| ssh / python3 | msys 内 MISSING(Windows 自带 OpenSSH 在 System32,登录 PATH 可见 `C:\Windows\System32`)|

## 1. 跨平台机制结论(适用于所有 skill)

- **shebang**:msys bash 会自己解释 `#!/usr/bin/env node` → 启动 native node ✓。
  但 **node 内部 spawn 一个 shebang 脚本(无扩展名)→ CreateProcess 直接失败**。
  所有「skill 调 skill」「skill 调 npm bin」的点都踩这个(见 §3)。
- **execSync(shell 字符串)**:native node 在 win32 用 **cmd.exe** 当 shell,不是 bash。
  `2>/dev/null`、`|| true`、管道、`sleep`、`find`(撞 System32 的字符串过滤器 find.exe)全部失效/危险。
- **`/tmp` 硬编码**:native node 写 `/tmp/x` → `C:\tmp`,与 msys `/tmp` 不通。必须 `os.tmpdir()`。
- **`os.homedir()`**:全部 28 个用到 home 的 bin 均已用 `homedir()`(无 `process.env.HOME` 直读)✓ —— 抽查通过。
- **`chmodSync(0o600/0o755)`**:win 上近似 no-op,所有调用点均已 try/catch 或无害 → 不用改。
- **`process.kill(pid, 'SIGTERM'/0)`**:win 上可用(0=存活探测,SIGTERM=强杀),PID 文件管理模式可以工作 ✓。
- **`spawn(..., {detached:true})` + unref**:win 上可用(detached → 新进程组)✓。
- **symlink**(agent-summary 的 current.md):win 需要管理员/开发者模式,**已 try/catch 包裹** → 优雅降级,只是少个软链 ✓。

## 2. 清单(skill × 问题 × 方案)

### ✅ 纯 HTTP/fetch,零外部进程 —— msys 直接可用(20 个)

agent-chrome, agent-desktop, agent-editor, agent-electron, agent-identity*,
agent-summary*, agent-webpage, artifact, cicy-agent, cicy-todo, cping, eng,
gemini-ask, globalApiToken, google, gpt-chat, telegram-web, tg, cicy-skill-spec*, cicy-team*

> *agent-identity:opencode/kiro 的 unix 路径(~/.local/share、~/.config)在 win 上自然报「not installed」,优雅降级,后续真有 win 用户再补 %LOCALAPPDATA% 路径。
> *agent-summary:symlink 降级见 §1。
> *cicy-skill-spec:chmod no-op 无害,scaffold 可用。
> *cicy-team:有一处 execFileSync('cicy-agent') → 见 §3 跨 skill 调用。

### ✅ 依赖 msys 自带工具,可用(4 个)

| skill | 外部依赖 | 结论 |
|---|---|---|
| pubip | curl | ✓(msys curl / Win10+ 自带 curl.exe 都行)|
| cicy-ssh | ssh | ✓(System32 OpenSSH 在 PATH)|
| cf / cf-tunnel / email / aliyun-cli `config` | $EDITOR(缺省 nano) | ✓ msys 有 nano |

### 🔧 本次已直接修(5 个,小改动)

| skill | 问题 | 修法 |
|---|---|---|
| aliyun-cli | ① 硬编码 `/tmp/aliyun-cli-<pid>`;② `ALIYUN_BIN` 无 .exe(win 上 install 后 status/已装检测永远 miss) | ① `os.tmpdir()`;② 定义处按 win32 加 `.exe`(下游 target 同步去重) |
| cicy-mihomo | ① 硬编码 `/tmp`;② `execSync('sleep 0.1')`;③ `execSync('find …')`(win 撞 System32 find.exe);④ BINARY_PATH 无 .exe(上游 URL 已支持 win32) | ① tmpdir();② Atomics.wait msleep;③ 原生 readdirSync 递归;④ win32 加 .exe |
| frp-client | ① pgrep/ps -o(msys 没有);② `execSync('sleep 0.1')` | ① findOrphanPid win32 直接 return 0(PID 文件管理不受影响);② msleep。install/service 本来就 bail "Windows not yet supported" ✓ |
| frp-server | 同 frp-client | 同上 |
| cicy-r2 | ① 硬编码 `/home/cicy/projects/...`(任何别的机器都炸,不只 win);② `spawnSync('npx')`(win 上 .cmd 不带 shell 必失败,Node≥18.20 直接 EINVAL) | ① 改 `CICY_R2_WRANGLER_CWD` env 可覆盖 + homedir 推导缺省 + 缺目录时明确报错;② win32 走 shell:true + 参数加引号 |

均已在 Linux 上回归(status 各命令输出不变,语法 check 通过)。

### ⚠️ 需要协调/后续改写(不在本次小修范围)

| skill | 问题 | 建议 |
|---|---|---|
| **跨 skill 调用**(claude-design→agent-chrome;agent-teams→agent-webpage;cicy-team→cicy-agent;feishu-cli→npx/lark-cli) | native node `spawn('agent-chrome')` 在 win 上无法执行 shebang 脚本,**取决于 cicy-code 装 skill 时是否生成 .cmd shim**(npm 同款做法) | ① 推荐 launcher 侧(cicy-code Go)为每个 skill bin 生成 `<name>.cmd` shim;② skill 侧配套:对带复杂参数(JS 表达式等)的调用点不能用 shell:true,应解析出目标 bin 的 js 路径后 `spawn(process.execPath, [jsPath, ...args])`。**等 w-10084 定 shim 方案后我再改 skill 侧 4 个点** |
| frp-client `install` | frp 的 win 资产是 `frp_*_windows_amd64.zip`(zip + frpc.exe),现走 tar.gz + `install -m`;`service` 是 systemd/launchd | install 需按 win 改写 zip+exe 路径(中等工作量);service 在 win 标 **windows-unsupported**(或将来接 NSSM/计划任务)。当前两者都已明确 bail,不静默坏 |
| proxy_ssh | python3 + autossh,msys 捆绑均无 | **windows-unsupported**(标注即可;真有需求再说) |
| feishu-cli | `spawnSync('npx', …)` 装 lark-cli;BIN 本体若是 native exe 则运行没问题,install 路径需 win32 shell:true | 待真机有 node 后实测 lark-cli 的 npm 包在 win 的落盘形态再修,盲改有引号风险 |
| cicy-mihomo `logs -f` / frp `logs -f` | spawn('tail') | ✓ msys tail 在 PATH 即可,无需改(已实测 /usr/bin/tail 存在) |

## 3. 给 cicy-code(w-10084)侧的输入

1. **node.exe 必须进捆绑**(或装机依赖检查):测试机整机无 node,34/34 skill 不可用。
2. **skill bin 的 .cmd shim**:决定「skill 调 skill」能否工作的关键;建议 launcher 安装 skill 时按 npm 模式生成 `<name>.cmd`(内容 `@node "%~dp0\..\skills\<name>\bin\<name>" %*` 之类)。定了我来改 skill 侧调用点。
3. msys 捆绑确认含 **tail、install、nano**(coreutils 全集)—— frp/mihomo logs、$EDITOR 缺省依赖它们;**pgrep 不用补**(代码已绕开)。
4. 测试机 `win` 的 msys 没有 jq/ssh(skill 侧不依赖,但 cicy-code statusline 的 jq 依赖要确认捆绑版本里真的有)。

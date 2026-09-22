# tg-set-avatar — 工作原理

## 通道

全部通过 `agent-electron`:

- `agent-electron webcontents --json` — 找到 Telegram Web K 目标(`url` 以 `https://web.telegram.org/k/` 开头)。
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — 在页面里执行下面的脚本。

源图片(下载的风格 SVG 或 `--image`)以 base64 分块(每块 24 KB)送进页面,因为 agent-electron
把 CDP 参数作为一个命令行参数传递,而单个参数有长度上限(Linux 128 KiB,Windows 更小)。
不自己开连接,不在机器上写文件,不修改页面代码。

## 页面侧 API(Telegram Web K,未打补丁)

| 调用 | 用途 |
|---|---|
| `apiManager.invokeApi('users.getFullUser', {id:{_:'inputUserSelf'}})`(兜底 `appUsersManager.getSelf()`) | 确认操作的是哪个账号,并从服务器读取当前 `photo.photo_id` |
| `<canvas>` + `toBlob('image/jpeg', 0.92)` | 渲染 640×640 头像:SVG 全尺寸绘制,位图居中裁成正方形,`emoji` 直接绘制 |
| `apiFileManager.upload({file, fileName})` | 把 JPEG 上传到 Telegram(`upload.saveFilePart`),返回 `InputFile` |
| `appProfileManager.uploadProfilePhoto(inputFile)` | 调用 `photos.uploadProfilePhoto`,同时更新页面缓存并触发 `avatar_update`,无需刷新就能看到新头像。若这个方法在本地出错(不是 RPC 错误)且头像没变,就直接调用 `photos.uploadProfilePhoto`——绝不重复上传 |

上传后从服务器重新读取头像 id,只有确实变了 `set` 才报告成功。

## 风格

`girl` 和 `girl-cartoon` 来自 [DiceBear](https://www.dicebear.com)(`avataaars` 作者 Pablo Stanley,
`adventurer` 作者 Lisa Wischofsky,均可免费个人和商业使用),从 `api.dicebear.com/9.x` 以 SVG 获取,
参数限定为可爱女生:长发、年轻发色、微笑、无胡子、粉彩背景。`emoji` 不需要网络。

## 说明

- Telegram Web K 还在启动时 `rootScope.myId = 0`,技能报页面错误(退出码 2)。矩阵格子只有在面板标签页可见时才会启动。
- Telegram 对头像上传限流;`FLOOD_WAIT_n` 会带上需要等待的秒数。
- 旧头像不会被删除,和官方客户端一样保留在账号头像历史里。

## 相关技能

- `agent-electron` — 本技能依赖的通道。
- `tg-set-name` — 显示名;`tg-set-username` — @用户名;同一通道。

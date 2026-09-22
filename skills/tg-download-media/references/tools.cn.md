# tg-download-media — 工作原理

## 传输层

一切都走 `agent-electron`:

- `agent-electron webcontents --json` — 发现 Telegram Web K 目标(`url` 以 `https://web.telegram.org/k/` 开头)。
- `agent-electron cdp wc:<id> Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` — 在页面里执行下面各步;文件内容按 4 MB 一片以 base64 传回。

不给页面打补丁。页面上只留一个小状态对象 `window.__tgDl`(解析出的 peer、取回的 media 对象、下载中的 Blob —— 每个 Blob 传完最后一片就释放)。

## 页面侧 API(未打补丁的 Telegram Web K)

| 步骤 | 调用 | 说明 |
|---|---|---|
| 解析 | `contacts.resolveUsername` / `messages.checkChatInvite` / `appChatsManager.getChat` | → `InputPeer`(频道另带 `InputChannel`) |
| 取消息 | `channels.getMessages({channel, id:[inputMessageID]})` 或 `messages.getMessages({id})` | 每批 50 条;拿到新鲜的 `access_hash` + `file_reference` |
| 规范化 | `appDocsManager.saveDoc(document)` / `appPhotosManager.savePhoto(photo)` | 文件**必须**先过 saveDoc,否则 `apiFileManager` 会抛 `reading 'id'` |
| 下载 | `apiFileManager.downloadMedia({media, thumb?})` | 返回 `Blob`;分片、DC 迁移、`file_reference` 过期重取都由页面自己处理 |
| 传回 | `Blob.slice(start, end)` + `FileReader.readAsDataURL` | base64 分片经 CDP 传回,先写 `<文件>.part`,完成后改名 |

## 注意

- 为什么按消息 id 而不是 `media_id`:`upload.getFile` 需要 `InputPhotoFileLocation` / `InputDocumentFileLocation` = `id` + `access_hash` + `file_reference`,后两者只在刚取回的消息上有。
- 速度受 CDP 限制:大文件约 0.5 MB/s,图片每张几秒。摸底时把 `--limit` 设小。
- 图片默认取最大尺寸(`--thumb` 取最小);文件取完整原件。
- 矩阵格子只有在所在面板标签页可见时才会启动;还在启动的页面直接按错误报出,不等。

## 相关技能

- `tg-export-history` — 产出本技能可读的 JSONL(`--from-jsonl`),含 `media_id` / `grouped_id`。
- `agent-electron` — 本技能依赖的传输层。

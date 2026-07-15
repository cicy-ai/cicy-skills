---
name: scrm
description: WeChat SCRM CLI: read customer/session/unread data from a local data source, and run device-side sync - unread brief to the CS supervisor, list rescan, chat archive.
---

# WeChat SCRM

`scrm` 是微信私域 SCRM 的命令行入口。数据不逆向,来自一台 Android 手机的纯人工模拟采集(ADB 截图 + OCR),
落进本地 SQLite,由一个数据源服务(默认 `:8900`)提供。

**两类命令,别混:**

- **读数据** —— 走数据源 API,快、不碰手机,随时可用:`unread` / `sessions` / `session` / `state`。
- **操作设备** —— 转发给 `scrm` Go 二进制,需要**手机在线 + 亮屏 + 停在会话列表**:`inbox` / `sync` / `feed` / `archive`。

## Scope

用这个 skill 当任务是:

- **拿当前未读**:`scrm unread`(总数 + 真人每人未读)。
- **看客户/会话**:`scrm sessions --real --unread`、`scrm session <名字> --ocr`。
- **看手机实时状态**:`scrm state`(当前在哪个页、在不在线)。
- **处理真人未读**:`scrm inbox` —— 检测真人未读,组装简报发给**客服主管** agent 分派处理。
- **同步/采集**:`scrm sync sessions`、`scrm feed`、`scrm archive --only <名字>`。

不要用它做:与 SCRM 无关的通用编码;或在数据源服务/手机不可用时期望设备命令成功。

## Quick start

```sh
scrm unread                     # 总未读 + 真人每人未读
scrm sessions --real --unread   # 有未读的真人会话
scrm session hayabusa --ocr     # 某会话的截图/OCR 状态 + 文本
scrm state                      # 手机当前页/未读/在线
scrm inbox                      # 真人未读 → 简报发客服主管
scrm sync sessions              # 重跑会话列表
```

所有读命令支持 `--json`,便于 agent 解析。

## 首次安装

这个 skill 只是**命令行前端**,引擎不在包里。装完 skill **先跑一次 `scrm setup`** —— 它从对象存储
下载本平台预编译引擎、铺好 OCR 脚本 + config 模板、建运行目录并自检,**无需 Go 工具链**:

```sh
scrm setup              # 下引擎 + 铺 OCR/config + 自检
scrm setup --with-ocr   # 顺带 pip 装 rapidocr_onnxruntime
scrm setup --force      # 覆盖重下引擎
```

引擎装到 `$SCRM_HOME/bin/scrm`(默认 `~/projects/wechat-scrm`)。支持 darwin/linux × amd64/arm64;
自建镜像用 `SCRM_ENGINE_BASE` 指向别的下载源。

`setup` 之后还需:

1. **OCR 依赖** —— `pip install rapidocr_onnxruntime`(或 `scrm setup --with-ocr`;引擎首次会自动拉起,常驻 `:8781`)。
2. **数据源** —— 二选一:跑 `scrm serve`(监听 `:8900`),或指向已内置 `/api/scrm/*` 的 cicy-code
   (`SCRM_API=http://127.0.0.1:8008/api/scrm`)。
3. **设备**(仅 `inbox`/`sync`/`feed`/`archive` 需要)—— Android 手机经 ADB 在线、亮屏、停在微信会话列表;
   采集为纯人工模拟,不碰微信进程。

覆盖默认的环境变量:`SCRM_API`(数据源地址)、`SCRM_HOME`(运行根目录)、`SCRM_BIN`(引擎二进制路径)、`SCRM_ENGINE_BASE`(引擎下载源)。

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)

# douyin2feishu

抖音视频一键转写并写入飞书多维表:解析分享链接抓元数据、下载无水印视频、Groq whisper 带时间戳转写,按字段写入指定 Base。凭证与目标表来自私有配置,不入库。

## 它做什么

输入一条抖音链接 → 输出飞书多维表里的一条记录,字段含:标题、作者、视频ID、视频链接、发布日期、点赞/收藏/转发/评论数、时长、来源、转写时间、**文案(整段)**、**时间线(逐段 `[mm:ss–mm:ss] 文本`)**,并自动编号 `NO.xxx`。

## 用法

```sh
douyin2feishu "<抖音链接>"            # 一键转写 + 写表
douyin2feishu "<抖音链接>" --dry-run  # 只跑不写,预览记录
```

## 依赖

- 系统命令:`ffmpeg`、`curl`、`lark-cli`(需先 `lark-cli auth login`)
- Groq API key(默认读 `~/cicy-ai/db/groq.json` 的 `api_key`)
- 私有配置 `~/cicy-ai/db/douyin2feishu.json`(`base_token` / `table_id` / 可选 `feishu_host` 等)

## 设计原则

**方法公有、凭证私有。** 代码里没有任何 token / base / 表 ID;全部来自 `~/cicy-ai/db/` 下的私有配置。可安全公开 / 提交公库。

详见 [references/tools.md](./references/tools.md)。

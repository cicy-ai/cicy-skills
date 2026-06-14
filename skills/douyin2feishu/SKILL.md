---
name: douyin2feishu
description: 抖音视频一键转写并写入飞书多维表:解析分享链接抓元数据、下载无水印视频、Groq whisper 带时间戳转写、LLM 生成摘要,按字段写入指定 Base。凭证与目标表来自私有配置,不入库。
---

# douyin2feishu

把一条抖音视频**一键**变成飞书多维表里的一条结构化记录:解析分享链接 → 抓标题/作者/点赞收藏等元数据 → 下载无水印视频 → 抽音频 → Groq `whisper-large-v3` 转写(整段文案 + 逐段带时间戳的时间线)→ `qwen3-32b` 生成摘要(一句话总结 + 要点)→ 按字段写入你指定的飞书 Base 表(`ID` 由飞书自动编号)。

**方法公有,凭证私有**:base/表 ID、Groq key 等全部来自 `~/cicy-ai/db/douyin2feishu.json`(及其引用的 `~/cicy-ai/db/groq.json`),**绝不写进 skill**。

## Scope

Use this skill when:

- 用户给了一个抖音视频链接/分享口令,想转成文字稿;
- 想把抖音视频的转写 + 元数据**归档进飞书多维表**;
- 需要批量把多条抖音视频转写入库(逐条调用即可)。

不适用:非抖音平台、需要登录墙后内容、把结果写到飞书以外的地方。

## Quick start

```sh
douyin2feishu "https://v.douyin.com/xxxxxxx/"            # 一键:转写并写入飞书表
douyin2feishu "https://v.douyin.com/xxxxxxx/" --dry-run  # 跑完整流程但不写表(预览将写入的记录)
douyin2feishu --help
```

首次使用前,准备私有配置(见 [tools.md](./references/tools.md))。需要本机有 `ffmpeg`、`curl`、已登录的 `lark-cli`,以及一个 Groq API key。

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)

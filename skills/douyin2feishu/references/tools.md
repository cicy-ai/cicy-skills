# douyin2feishu — config / env / 依赖 / 流程

## 私有配置(凭证不入 skill)

路径:`~/cicy-ai/db/douyin2feishu.json`(建议 `chmod 600`)。可用 `D2F_CONFIG` 环境变量覆盖路径。

```json
{
  "base_token":   "飞书多维表 app_token(必填)",
  "table_id":     "目标表 tbl... id(必填)",
  "feishu_host":  "你的租户域名,如 pcn0gj2p9lrd.feishu.cn(可选,仅用于回链)",
  "groq_key_file":"~/cicy-ai/db/groq.json(可选,默认值)",
  "groq_key":     "直接给 key 也行(可选;给了就不读 groq_key_file)",
  "groq_model":   "whisper-large-v3(可选,ASR 模型)",
  "summary":      "true(可选,转写后是否生成「摘要」字段;false 关闭)",
  "summary_model":"qwen/qwen3-32b(可选,生成摘要的 LLM;中文强)",
  "language":     "zh(可选)",
  "source":       "抖音(可选,写入「来源」字段)"
}
```

Groq key 文件结构:`{ "api_key": "gsk_..." }`(默认 `~/cicy-ai/db/groq.json`)。

## 目标表字段(全 text 类型,按名写入)

`标题`、`作者`、`视频ID`、`视频链接`、`发布日期`、`点赞数`、`收藏数`、`转发数`、`评论数`、`时长`、`来源`、`转写时间`、`摘要`、`文案`、`时间线`。
表里若缺某字段,该字段会被飞书忽略;字段名需与表一致。
`ID` 是飞书 **auto_number**(自动编号)字段,本工具不传、不计算。
`摘要` 由 `summary_model` 在转写后生成(一句话总结 + 要点);摘要失败不影响转写入库。

## 系统依赖

- `ffmpeg`(抽音频)、`curl`(下载/调用)、`lark-cli`(写飞书,需先 `lark-cli auth login`)。
- Node ≥ 18,零 npm 依赖。

## 网络 / 代理(关键)

- **抖音**在国内:所有抖音请求走 `curl --noproxy '*'`(绕开本机海外代理)。
- **Groq**在美国:转写请求**走**本机代理(继承环境 `http(s)_proxy`)。
- **lark-cli**:以 `LARK_CLI_NO_PROXY=1` 调用(飞书在国内,绕代理)。

## 流程

1. 短链 `curl -IL` 跟跳转 → `iesdouyin.com/share/video/<id>`;
2. 拉 share 页,从 `_ROUTER_DATA` 解出 desc/author/statistics/play_addr.uri/create_time/duration;
3. `aweme.snssdk.com/aweme/v1/play/?video_id=<uri>` 下无水印 mp4;
4. `ffmpeg` 抽 16k 单声道 mp3;
5. Groq `audio/transcriptions`(`verbose_json`)→ 文案 + 逐段时间线;
6. Groq `chat/completions`(`summary_model`,`reasoning_format:hidden`)→ 摘要(失败跳过,不致命);
7. `lark-cli base +record-upsert` 写入(无 record-id = 新建)。

临时文件在系统临时目录,跑完自动清理。

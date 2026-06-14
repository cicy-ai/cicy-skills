# douyin2feishu — command reference

```
douyin2feishu <抖音链接>            一键:解析→下载→转写→写飞书表(新建 NO.xxx 记录)
douyin2feishu <抖音链接> --dry-run  跑完整流程但不写表,打印将写入的记录(预览/自检)
douyin2feishu --help | -h          用法
```

## 参数

- `<抖音链接>`:抖音分享短链(`https://v.douyin.com/xxx/`)或 `iesdouyin.com/share/video/<id>` 链接。位置参数,任意位置均可。
- `--dry-run`:执行解析/下载/转写全流程,但**不写飞书**;输出将要写入的记录(文案截断、时间线只报段数),用于验证链路或预检字段。

## 输出

成功(stdout,JSON 一行):
```json
{"ok":true,"id":"NO.016","title":"…","author":"…","awemeId":"7649…","chars":1909,"segments":159,"table":"https://<host>/base/<token>?table=<table_id>"}
```
进度走 stderr(`① 解析 … ⑥ 写入 …`)。失败:`ERROR: <原因>`,退出码 1。

## 退出码

- `0` 成功 / `--help`
- `1` 出错(缺配置、解析失败、Groq/飞书调用失败等)

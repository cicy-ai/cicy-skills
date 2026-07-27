# scrm — endpoints / env / architecture

## 环境变量

| 变量 | 默认 | 作用 |
|------|------|------|
| `SCRM_API` | `http://127.0.0.1:8900` | 数据源服务地址(读命令用) |
| `SCRM_HOME` | `~/projects/wechat-scrm` | 项目根(设备命令的 WSCRM_HOME) |
| `SCRM_BIN` | `$SCRM_HOME/bin/scrm` | scrm Go 二进制路径(设备命令转发目标) |

## 数据源 API(读命令背后)

| 端点 | 返回 |
|------|------|
| `GET /api/state` | watcher 实时:`state`(页面)、`unread`(总未读)、`device`、`unread_at` |
| `GET /api/data` | 客户会话:`name`、`type`、`unread`、`preview`、`msgCount`、`sync`、`messages`、`profiles` |
| `GET /api/lists` | 原始名单:`sessions` / `address_book` / `friend_count` |
| `GET /api/archive?name=` | 某会话存档:`shots_done`、`ocr_done`、`shot_count`、`shots[]`、`ocr_text` |

## 架构

```
Android 手机 ──ADB截图──▶ scrm(Go,纯 Go 无 cgo)──OCR──▶ SQLite
                                │                        ▲
                                │ /api/tmux/send         │ /api/data /api/state ...
                                ▼                        │
                        cicy-code agent 群         数据源服务 :8900 ──▶ dashboard / 本 skill
                     (客服主管 + 每客户一个 agent)
```

- **读**:本 skill → `:8900` API → SQLite。快、只读、不碰手机。
- **写/采集**:本 skill → `scrm` 二进制 → ADB 操作手机。需设备在线。
- **未读闭环**:`scrm inbox` 检测真人未读 → 简报发 `客服主管` agent → 主管用 `cicy-agent` 分派给每个客户的 agent 处理。

## 退出码

- `0` 成功
- `1` 失败:连不上数据源 / 设备离线息屏 / 未知命令 / 缺二进制

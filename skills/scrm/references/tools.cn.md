# scrm — 端点 / 环境变量 / 架构

## 环境变量

| 变量 | 默认值 | 作用 |
|------|--------|------|
| `SCRM_API` | `http://127.0.0.1:8900` | 数据源服务地址（用于读命令） |
| `SCRM_HOME` | `~/projects/wechat-scrm` | 项目根目录（设备命令的 WSCRM_HOME） |
| `SCRM_BIN` | `$SCRM_HOME/bin/scrm` | scrm Go 二进制路径（设备命令转发目标） |

## 数据源 API（读命令背后的接口）

| 端点 | 返回内容 |
|------|----------|
| `GET /api/state` | watcher 实时状态：`state`（页面）、`unread`（总未读数）、`device`、`unread_at` |
| `GET /api/data` | 客户会话数据：`name`、`type`、`unread`、`preview`、`msgCount`、`sync`、`messages`、`profiles` |
| `GET /api/lists` | 原始名单数据：`sessions` / `address_book` / `friend_count` |
| `GET /api/archive?name=` | 某会话存档数据：`shots_done`、`ocr_done`、`shot_count`、`shots[]`、`ocr_text` |

## 架构

```
Android 手机 ──ADB截图──▶ scrm(Go,纯 Go 无 cgo)──OCR──▶ SQLite
                                │                        ▲
                                │ /api/tmux/send         │ /api/data /api/state ...
                                ▼                        │
                        cicy-code agent 群         数据源服务 :8900 ──▶ dashboard / 本技能
                     (客服主管 + 每客户一个 agent)
```

- **读取**：本技能 → `:8900` API → SQLite。快速、只读、不操作手机。
- **写入/采集**：本技能 → `scrm` 二进制 → 通过 ADB 操作手机。需要设备在线。
- **未读处理闭环**：`scrm inbox` 检测到真人未读消息 → 将简报发送给 `客服主管` agent → 主管通过 `cicy-agent` 分配给每个客户的 agent 进行处理。

## 退出码

- `0` 成功
- `1` 失败：无法连接数据源 / 设备离线息屏 / 未知命令 / 缺少二进制文件

# scrm — command reference

## 读数据(走 :8900 数据源,不碰设备)

```
scrm unread                     总未读 + 真人每人未读(preview)
scrm sessions [flags]           会话列表
    --real                        只看真人
    --group                       只看群
    --unread                      只看有未读的
    --json                        JSON 输出
scrm session <名字> [--ocr] [--json]
                                某会话:截图张数 / 截图是否全 / OCR 是否完成+行数
    --ocr                         附上拼接后的 OCR 全文
scrm state [--json]             手机当前页 / 未读数 / 在线状态(watcher 实时)
```

## 操作设备(转发 scrm 二进制;需手机在线+亮屏+列表页)

```
scrm inbox [--dry] [--master <pane>]
                                检测真人未读 → 组装简报 → 发客服主管 agent 分派
                                --dry 只打印不发;--master 指定主管 pane
scrm sync <sessions|contacts>   重跑列表:抓取 → 去重 → 交叉引用分类 → 入库
                                (空捕获拒绝覆盖,保护现有数据)
scrm feed [--prime|--dry]       扫列表 → 变化的会话把新消息推给对应 agent
                                --prime 首轮只建基线不推;--dry 只看不发
scrm archive [页数=2] [--only <名字>]
                                进聊天抓 N 页截图 + 拼接 OCR 存档
```

## 全局

- 所有读命令支持 `--json`。
- 退出码:0 成功;1 出错(连不上服务 / 设备离线 / 未知命令)。

# scrm — 命令参考

## 读取数据（通过 :8900 数据源，不直接操作设备）

```
scrm unread                     总未读数 + 每位真人客服未读数（预览）
scrm sessions [flags]           会话列表
    --real                        仅显示真人会话
    --group                       仅显示群聊会话
    --unread                      仅显示有未读消息的会话
    --json                        JSON 格式输出
scrm session <名字> [--ocr] [--json]
                                特定会话详情：截图数量 / 截图是否完整 / OCR 状态及行数
    --ocr                         附加拼接后的 OCR 全文内容
scrm state [--json]             当前手机页面 / 未读数 / 在线状态（watcher 实时更新）
```

## 操作设备（需转发 scrm 二进制文件；要求手机在线、亮屏且停留在列表页面）

```
scrm inbox [--dry] [--master <pane>]
                                检测真人未读消息 → 生成摘要报告 → 发送给客服主管 agent 进行任务分配
                                --dry 仅打印日志不发送；--master 指定主管的 pane
scrm sync <sessions|contacts>   重新处理列表：抓取 → 去重 → 交叉引用分类 → 存入数据库
                                （空捕获时拒绝覆盖，以保护现有数据）
scrm feed [--prime|--dry]       扫描列表 → 将有变更的会话新消息推送至对应 agent
                                --prime 首轮仅建立基线不推送；--dry 仅查看不发送
scrm archive [页数=2] [--only <名字>]
                                进入聊天抓取 N 页截图 + 拼接 OCR 内容进行归档
```

## 全局说明

- 所有读取命令均支持 `--json` 参数。
- 退出码：0 成功；1 出错（无法连接服务 / 设备离线 / 未知命令）。

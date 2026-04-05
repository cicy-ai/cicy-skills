# aeng-page-exec

通过 WebSocket 在前端页面执行 JS 代码，用于调试当前界面。

## 用法

```bash
python3 ~/Private/skills/aeng-page-exec.py '<js代码>'
```

## 示例

```bash
# 获取页面标题
python3 ~/Private/skills/aeng-page-exec.py 'document.title'

# 弹窗测试
python3 ~/Private/skills/aeng-page-exec.py 'alert("hello")'

# 修改样式
python3 ~/Private/skills/aeng-page-exec.py 'document.body.style.background = "red"'

# 获取元素
python3 ~/Private/skills/aeng-page-exec.py 'document.querySelector(".chat-input")?.value'
```

## 原理

```
Python Script
  → POST /api/chat/push {type: 'desktop_event', data: {type: 'eval', code: '...'}}
  → WebSocket 推送到前端
  → useDesktopEvents.ts 收到 eval 事件
  → eval(code) 执行
```

## 查看结果

打开前端 DevTools Console，会看到 `[AgentPage V2] desktop event: eval`

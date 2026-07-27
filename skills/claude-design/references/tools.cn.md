# claude-design — 子命令内部实现

将每个 `claude-design` 子命令映射到底层 `agent-chrome` CDP 调用。调试时请以此文件作为权威参考。

## `open`

```
agent-chrome [--client <c>] launch <idx> --url https://claude.ai/design
```

## `new`

```
agent-chrome [--client <c>] cdp Page.navigate '{"url":"https://claude.ai/design"}' --idx <n>
```

## `prompt`

包含三次 CDP `Runtime.evaluate` 调用：

1. **等待输入组件挂载：**
   ```js
   document.querySelector('textarea[data-testid="chat-composer-input"]') ? "ready" : "wait"
   ```
   以 1 秒间隔轮询，超时时间 60 秒。

2. **注入文本**（兼容 React，UTF-8 安全）：
   ```js
   const t = document.querySelector('textarea[data-testid="chat-composer-input"]');
   const txt = new TextDecoder('utf-8').decode(
     Uint8Array.from(atob('<base64>'), c => c.charCodeAt(0))
   );
   t.focus();
   Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, txt);
   t.dispatchEvent(new Event('input', { bubbles: true }));
   ```
   返回值 `{ok, len, hasZh}` —— `hasZh` 是健全性检查字段，用于验证中文是否解码正确。若中文提示词返回 `hasZh: false`，说明 base64 往返传输丢失了字节数据。

3. **点击发送：**
   ```js
   document.querySelector('[data-testid="chat-send-button"]').click();
   ```

若设置了 `--wait` 参数，将额外执行两个轮询循环：
- 等待发送按钮变为 `disabled` 状态（= 开始发送），超时时间 10 秒
- 等待按钮恢复为可用状态（= 助手空闲），超时时间 `--timeout`（默认 10 分钟）

## `download`

1. 打开分享菜单：
   ```js
   const btn = document.querySelector('[data-testid="share-button"]')
     || Array.from(document.querySelectorAll('button'))
          .find(b => /share|分享|共有/i.test((b.textContent||'').trim()));
   btn.click();
   ```

2. 可选设置下载目录：
   ```
   agent-chrome cdp Page.setDownloadBehavior '{"behavior":"allow","downloadPath":"<abs>"}' --idx <n>
   ```
   仅当 `--out` 为绝对路径时执行。

3. 点击与 `--type` 匹配的菜单项：
   ```js
   const pats = {editable:['editable','可编辑'], standalone:['standalone','独立','export as standalone'], zip:['zip','.zip','project as']}[type];
   const items = Array.from(document.querySelectorAll('[role="menuitem"], button, a'));
   const hit = items.find(el => pats.some(p => (el.textContent||'').toLowerCase().includes(p)));
   hit.click();
   ```

4. 等待导出完成（可编辑类型默认 15 秒，独立类型默认 90 秒；可通过 `--timeout` 覆盖）。

## `exec`

```
agent-chrome cdp Runtime.evaluate '{"expression":"<expr>","returnByValue":true}' --idx <n>
```

## `status`

```
agent-chrome targets --idx <n>            # 检查 chrome 是否运行
agent-chrome cdp Runtime.evaluate '...'   # 获取 location.href 和输入组件状态
```

## 使用的选择器（可能随 claude.ai 界面变更）

| 元素         | 选择器                                                       |
|--------------|--------------------------------------------------------------|
| 输入组件     | `textarea[data-testid="chat-composer-input"]`                |
| 发送按钮     | `[data-testid="chat-send-button"]`                           |
| 分享按钮     | `[data-testid="share-button"]`（备用方案：文本匹配 `/share/i`）|
| 导出选项     | `[role="menuitem"], button, a` 配合文本过滤                  |

若 Claude 修改上述任何选择器，请同步更新 `bin/claude-design` 和本文件。

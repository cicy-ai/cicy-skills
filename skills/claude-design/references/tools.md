# claude-design — subcommand internals

Mapping from each `claude-design` subcommand to the underlying `agent-chrome`
CDP calls. Use this as the source of truth when debugging.

## `open`

```
agent-chrome [--client <c>] launch <idx> --url https://claude.ai/design
```

## `new`

```
agent-chrome [--client <c>] cdp Page.navigate '{"url":"https://claude.ai/design"}' --idx <n>
```

## `prompt`

Three CDP `Runtime.evaluate` calls:

1. **Wait for composer to mount:**
   ```js
   document.querySelector('textarea[data-testid="chat-composer-input"]') ? "ready" : "wait"
   ```
   Polled at 1 s intervals, timeout 60 s.

2. **Inject the text** (React-aware, UTF-8 safe):
   ```js
   const t = document.querySelector('textarea[data-testid="chat-composer-input"]');
   const txt = new TextDecoder('utf-8').decode(
     Uint8Array.from(atob('<base64>'), c => c.charCodeAt(0))
   );
   t.focus();
   Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, txt);
   t.dispatchEvent(new Event('input', { bubbles: true }));
   ```
   Returns `{ok, len, hasZh}` — `hasZh` is a sanity check that Chinese decoded
   correctly. If you see `hasZh: false` for a Chinese prompt, the base64 round
   trip lost the bytes.

3. **Click Send:**
   ```js
   document.querySelector('[data-testid="chat-send-button"]').click();
   ```

If `--wait` is set, two additional poll loops:
- wait for send button to go `disabled` (= sending started), timeout 10 s
- wait for it to come back enabled (= assistant idle), timeout `--timeout` (default 10 min)

## `download`

1. Open share menu:
   ```js
   const btn = document.querySelector('[data-testid="share-button"]')
     || Array.from(document.querySelectorAll('button'))
          .find(b => /share|分享|共有/i.test((b.textContent||'').trim()));
   btn.click();
   ```

2. Optionally set download dir:
   ```
   agent-chrome cdp Page.setDownloadBehavior '{"behavior":"allow","downloadPath":"<abs>"}' --idx <n>
   ```
   Only when `--out` is an absolute path.

3. Click the menu item matching `--type`:
   ```js
   const pats = {editable:['editable','可编辑'], standalone:['standalone','独立','export as standalone'], zip:['zip','.zip','project as']}[type];
   const items = Array.from(document.querySelectorAll('[role="menuitem"], button, a'));
   const hit = items.find(el => pats.some(p => (el.textContent||'').toLowerCase().includes(p)));
   hit.click();
   ```

4. Sleep to give the export time to land (editable: 15 s, standalone: 90 s by
   default; override with `--timeout`).

## `exec`

```
agent-chrome cdp Runtime.evaluate '{"expression":"<expr>","returnByValue":true}' --idx <n>
```

## `status`

```
agent-chrome targets --idx <n>            # is chrome running?
agent-chrome cdp Runtime.evaluate '...'   # location.href + composer presence
```

## Selectors used (subject to claude.ai UI changes)

| element        | selector                                                       |
|----------------|----------------------------------------------------------------|
| composer       | `textarea[data-testid="chat-composer-input"]`                  |
| send button    | `[data-testid="chat-send-button"]`                             |
| share button   | `[data-testid="share-button"]` (fallback: text match `/share/i`) |
| export items   | `[role="menuitem"], button, a` filtered by text                |

If Claude changes any of these, update both `bin/claude-design` and this file.

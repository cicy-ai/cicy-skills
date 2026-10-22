// ==UserScript==
// @name         Telegram Web 自动 JOIN (精简版)
// @namespace    cicy
// @version      2.1.4
// @description  自己换群(Web K 内部路由,不重载)+ 点 JOIN(含确认弹窗)+ FLOOD_WAIT 暂停 + 实时上报真实已加入的群
// @match        https://web.telegram.org/k/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  // 重复注入保护。apply 是往**已经活着的页面**注入,页面里可能已经有一份在跑。
  // 以前没有这一段:注两次 = 两份实例各自定时轮询、各自换群、各自写标题,
  // 页面会被拖死(实测 xs-3006 三格主框架卡死、JS 执行不进去)。
  // 所以每份实例都把自己的定时器登记下来,新实例启动时先把旧的全部拆掉。
  try {
    const prev = window.__cicyTgAutojoin;
    if (prev && Array.isArray(prev.__timers)) {
      for (const t of prev.__timers) { try { clearInterval(t); clearTimeout(t); } catch (e) {} }
    }
  } catch (e) {}
  const TIMERS = [];
  const every = (fn, ms) => { const t = setInterval(fn, ms); TIMERS.push(t); return t; };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); TIMERS.push(t); return t; };

  let floodUntil = 0;   // flood 冷却截止时间戳

  const VERSION = '2.1.4';   // 与顶部 @version 保持一致
  const TGSOU = 'https://tgsou.cicy-ai.com';
  const TOKEN = '3e2733bc6f7da1d7ddbb5087';   // tgsou fleet token(低权限,面板里也是这个)
  const SYNC_EVERY = 30000;  // 多久对账一次真实已加入的群
  const POLL_EVERY = 5000;   // 多久问一次「自动加群」开关(也决定「开一个」多久生效)

  let mobile = '';           // 本账号手机号,从 Telegram 自己拿(不看 fleet.json —— 那份是手写的,常年过期)
  let live = 0;              // 会话里真实存在的、有用户名的群/频道数
  let stats = null;          // {assigned, joined, at} —— tgsou 回的交集统计
  let auto = { on: false, sec: 20 };
  let lastOpen = 0, opening = false;

  const managers = () => (window.rootScope && window.rootScope.managers) || (window.appImManager && window.appImManager.managers);
  const api = (p) => fetch(TGSOU + p + (p.indexOf('?') < 0 ? '?' : '&') + 't=' + TOKEN, { cache: 'no-store' }).then((r) => r.json());

  // ── 对外状态 ───────────────────────────────────────────
  window.__cicyTgAutojoin = {
    version: VERSION,
    __timers: TIMERS,          // 给下一次注入用:拆掉这一份的定时器
    get floodUntil() { return floodUntil; },
    get floodLeft() { return Math.max(0, Math.ceil((floodUntil - Date.now()) / 1000)); },
    get flooding() { return Date.now() < floodUntil; },
    get mobile() { return mobile; },
    get liveGroups() { return live; },
    get stats() { return stats; },
    get auto() { return { ...auto }; },
    open: (un) => switchTo(un),        // 手动测试用
  };

  // ── 换群:用 Web K 自己的路由,不重载页面 ───────────────
  // 以前是面板把新 URL 交给主进程 loadURL —— 那是**整页重载**(先 about:blank 再加载),
  // 每 20 秒一次,Telegram 永远初始化不完,格子就是一片白。tgsou 的做法才是对的:
  // resolveUsername → setInnerPeer,SPA 级切换,连接和会话都不动。脚本就在页面里,
  // 所以这件事由脚本自己做最省事,也不再需要面板参与。
  async function switchTo(un) {
    const m = managers(), im = window.appImManager;
    if (!m || !im || !im.setInnerPeer) return 'NO_IM';
    const r = await m.appUsersManager.resolveUsername(String(un).replace(/^@/, ''));
    if (!r || r.id == null) return 'NO_PEER';
    const isChat = (r._ === 'channel' || r._ === 'chat');
    const pid = (r.id && r.id.toPeerId) ? r.id.toPeerId(isChat) : (isChat ? -Number(r.id) : Number(r.id));
    await im.setInnerPeer({ peerId: pid });
    return 'OK';
  }
  // 私有群只有邀请链接,没有 username 可解析。用 tgaddr 深链 —— 改 location.hash 是
  // **同文档导航**(hashchange),Web K 的路由会接住,同样不重载。
  function openInvite(ref) {
    // ref 对公开群是 "@username",对私有群才是 "+邀请hash"。以前这里只剥 `+`,
    // 于是公开群被拼成 https://t.me/+@username —— 一个不存在的链接,而且照样
    // return true。调用方据此认为"开成功了",既没换群也不再试后面的候选群,
    // 这一格就永久空转。只处理真邀请链接,其余交回给 switchTo。
    const s = String(ref || '');
    const inv = (/^\+([A-Za-z0-9_-]+)$/.exec(s) || /t\.me\/\+([A-Za-z0-9_-]+)/.exec(s) || [])[1] || '';
    if (!inv) return false;
    const h = '#?tgaddr=' + encodeURIComponent('https://t.me/+' + inv);
    if (location.hash === h) { location.hash = '#'; setTimeout(() => { location.hash = h; }, 50); }
    else location.hash = h;
    return true;
  }

  // FLOOD_WAIT 从错误对象里就地取。**不能只靠 unhandledrejection**:换群这条路的
  // 拒绝被 openNext 的 try/catch 接住了,按规范就不再是 unhandled,那个监听器永远
  // 收不到 —— 限流拿不到,脚本也就不知道该停,继续每 20 秒去撞,反而加剧限流。
  function noteFlood(e) {
    const sec = +(/FLOOD_WAIT_(\d+)/.exec((e && (e.type || e.message)) || '')?.[1] || 0);
    if (!sec) return false;
    floodUntil = Date.now() + (sec + 5) * 1000;
    console.warn(`[flood] 暂停 ${sec}s,恢复于 ${new Date(floodUntil).toLocaleTimeString()}`);
    return true;
  }

  async function openNext() {
    if (opening || !mobile || Date.now() < floodUntil) return;
    opening = true;
    try {
      // 一次多要几个。群的用户名可能已经失效,resolveUsername 直接抛错 —— 只要一个的话
      // 这一次就白点了(「开一个」看着像坏的)。挨个试,第一个成功就停。
      const j = await api('/api/random-unjoined?n=3&mobile=' + encodeURIComponent(mobile));
      if (!j || !j.ok) { lastOpen = Date.now(); return; }   // 别每秒重打接口
      if (stats) stats = { assigned: j.assigned, joined: j.joined, at: Date.now() };
      const list = j.picked || [];
      if (!list.length) { auto.on = false; return; }       // 分配的群全加完了
      for (const g of list) {
        const un = String(g.username || '').replace(/^@/, '');
        let ok = false;
        if (un) {
          try { ok = (await switchTo(un)) === 'OK'; }
          catch (e) { ok = false; if (noteFlood(e)) { lastOpen = Date.now(); return; } }
        }
        if (!ok) ok = openInvite(g.ref);                   // 私有群:邀请链接深链
        if (ok) { lastOpen = Date.now(); return; }
      }
      lastOpen = Date.now();                               // 三个都开不了:也记一次,别马上再撞
    } catch (e) { /* 代理抖动:下一轮再说 */ }
    finally { opening = false; }
  }

  // ── 真实已加入的群 ─────────────────────────────────────
  // tgsou 的 joins 表只有 POST /api/joined 一个写入口:不上报 = 已加入永远 0,
  // 而且同一批群会被反复发出来。面板够不到格子的 window,所以由脚本自己报。
  async function reconcile() {
    const m = managers();
    if (!m) return;
    if (!mobile) {
      try { const self = await m.appUsersManager.getSelf(); if (self && self.phone) mobile = '+' + String(self.phone).replace(/^\+/, ''); } catch (e) {}
    }
    const uns = [];
    for (let f = 0; f < 2; f++) {                       // 0 = 主文件夹, 1 = Archived
      let d = [];
      try { d = await m.dialogsStorage.getFolderDialogs(f); } catch (e) {}
      for (const it of d || []) {
        let p = null;
        try { p = await m.appPeersManager.getPeer(it.peerId || it.peer); } catch (e) {}
        const u = (p && p.username) || (p && p.usernames && p.usernames[0] && p.usernames[0].username) || '';
        if (u) uns.push(String(u).toLowerCase());
      }
    }
    live = uns.length;
    if (!mobile || !uns.length) return;                 // 会话还没加载完就别上报,否则会把已加入的误判成 left
    try {
      const r = await fetch(TGSOU + '/api/joined?t=' + TOKEN, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, usernames: uns }),
      });
      const j = await r.json();
      if (j && typeof j.joined === 'number') stats = { assigned: j.total, joined: j.joined, at: Date.now() };
    } catch (e) {}
  }

  // ── 开关:服务端说了算 ─────────────────────────────────
  async function pollAuto() {
    if (!mobile) return;
    try {
      const j = await api('/api/autojoin?mobile=' + encodeURIComponent(mobile));
      if (!j || !j.ok) return;
      auto = { on: !!j.on, sec: Math.max(5, Math.min(600, Number(j.sec) || 20)) };
      if (j.once) openNext();                            // 面板点的「开一个」
    } catch (e) {}
  }

  later(() => { reconcile(); pollAuto(); }, 5000);
  every(reconcile, SYNC_EVERY);
  every(pollAuto, POLL_EVERY);
  every(() => {
    if (!auto.on || opening) return;
    if (Date.now() < floodUntil) return;                 // 限流中:等,不浪费群也不加剧限流
    if (Date.now() - lastOpen < auto.sec * 1000) return;
    openNext();
  }, 1000);

  // document.title 是**矩阵面板唯一能看到格子内部状态的通道**(格子是主进程的
  // BrowserView,面板只收到 {url,title,loading,identity})。格子没有标签栏,用户看不见。
  // 顺序固定:⏳ 只在限流时出现在最前,其后第一个 vX.Y.Z 是版本。
  const fmt = (x) => { const m = Math.floor(x / 60); return m ? `${m}分${String(x % 60).padStart(2, '0')}秒` : `${x}秒`; };
  every(() => {
    const left = Math.max(0, Math.ceil((floodUntil - Date.now()) / 1000));
    const parts = [];
    if (left > 0) parts.push(`⏳ ${fmt(left)}`);
    parts.push(`v${VERSION}`);
    if (auto.on) parts.push(`自动${auto.sec}秒`);
    if (stats) parts.push(`已加 ${stats.joined}/${stats.assigned}`);
    parts.push(`在群 ${live}`);
    if (mobile) parts.push(mobile);
    const t = parts.join(' · ');
    // 只有自己写的标题才覆盖:Web K 切会话时会把标题改成群名,那是它的正常行为,
    // 但面板要读的是这行状态,所以每秒盖回来(内容不变就不写,避免无谓的事件)。
    if (document.title !== t) document.title = t;
  }, 1000);

  // ── 主循环:点 JOIN ────────────────────────────────────
  every(() => {
    if (Date.now() < floodUntil) return;   // flood 期间直接跳过，不点

    // 私有群/邀请链接会弹确认框,不点就一直卡在那儿,后面的群也换不动。真实结构:
    //   <div class="popup popup-peer popup-join-chat-invite active">
    //     <div class="popup-container">…<span class="chat-participants-count">10 635 members</span>
    //       <div class="popup-buttons">
    //         <button class="popup-button btn primary rp"><span class="i18n">Join Group</span></button>
    //         <button class="popup-button btn primary rp"><span class="i18n">Cancel</span></button>
    // Cancel 和 Join 是**完全相同的类名**,只有文字不同 —— 必须按文字挑,点错 = 自己拒绝入群。
    // 可见性不能用 offsetParent:弹窗容器是 position:fixed,那样判恒为 null,会整个漏掉。
    // 用 getClientRects().length 才对。
    const popBtn = () => {
      const boxes = [
        ...document.querySelectorAll('.popup-join-chat-invite.active'),  // 邀请入群,最常见
        ...document.querySelectorAll('.popup.active'),                   // 其它确认框兜底
      ];
      for (const box of boxes) {
        if (!box.getClientRects().length) continue;
        for (const b of box.querySelectorAll('.popup-button')) {
          if (/^(join group|join channel|join|加入)/i.test((b.textContent || '').trim())) return b;
        }
      }
      return null;
    };
    const pop = popBtn();
    if (pop) { pop.click(); return; }

    const btn = document.querySelector("#column-center > div.chats-container.tabs-container > div.chat.tabs-tab.can-click-date.active > div.chat-input.chat-input-main > div > div.chat-input-control.chat-input-wrapper > div > div.chat-input-plate-center > button.btn-primary.btn-color-primary.text-bold.chat-input-control-button.chat-input-plate-button.rp");
    // 以前靠 location.href 带 #@ 来限定;setInnerPeer 换会话不一定改 hash,所以改成认按钮文字:
    // 这个位置的按钮也可能是「取消静音」「开始」,别乱点。
    if (btn && /^(join|加入|subscribe|订阅)/i.test((btn.textContent || '').trim())) btn.click();
  }, 5000);

  // ── 捕获 FLOOD_WAIT ────────────────────────────────────
  window.addEventListener('unhandledrejection', (e) => {
    const { code, message, type } = e.reason ?? {};
    console.error("[reason]", { code, message, type });

    const sec = +(/FLOOD_WAIT_(\d+)/.exec(type || message || '')?.[1] || 0);
    if (sec) {
      floodUntil = Date.now() + (sec + 5) * 1000;
      console.warn(`[flood] 暂停 ${sec}s，恢复于 ${new Date(floodUntil).toLocaleTimeString()}`);
      e.preventDefault();
    }
  });
})();

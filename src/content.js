/* Excalidraw Radial Menu — content script */
(function () {
  'use strict';
  const ERM = window.ERM;
  if (!ERM || window.__ermLoaded) return;
  window.__ermLoaded = true;

  let cfg = Object.assign({}, ERM.DEFAULTS);
  let hostEl = null, shadow = null, layer = null;
  let wheel = null;            // активное колесо (инструменты либо цвета)
  let subTool = null;          // инструмент, для которого открыто подменю цвета
  let open = false, openedAt = 0, sticky = false, synthetic = false, closeTimer = 0;
  let px = window.innerWidth / 2, py = window.innerHeight / 2;
  let cx = px, cy = py;
  let dwellTimer = 0, dwellIdx = -1, dwellX = 0, dwellY = 0;
  let lastColorable = 'freedraw';

  const DWELL_TOL = 8;         // px: насколько можно дрогнуть пером, не сбив удержание
  const clamp = (v, a, b) => (a > b ? (a + b) / 2 : Math.max(a, Math.min(b, v)));
  const isCaps = () => cfg.trigger && cfg.trigger.code === 'CapsLock';
  const editing = () => {
    const a = document.activeElement;
    return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable);
  };
  const anim = () => cfg.animSpeed || 1;

  /* ------------------------------------------------------------ настройки */
  chrome.storage.sync.get(ERM.DEFAULTS, (v) => { cfg = Object.assign({}, ERM.DEFAULTS, v); });
  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'sync') return;
    for (const k in ch) cfg[k] = ch[k].newValue;
    if (open) hide(false);
  });

  /* ---------------------------------------------------------------- слой */
  function ensureHost() {
    if (hostEl && hostEl.isConnected) return;
    hostEl = document.createElement('div');
    hostEl.id = 'excalidraw-radial-menu';
    hostEl.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;' +
      'z-index:2147483600;pointer-events:none;border:0;margin:0;padding:0;';
    shadow = hostEl.attachShadow({ mode: 'open' });
    const st = document.createElement('style');
    st.textContent = ERM.CSS;
    shadow.appendChild(st);
    layer = document.createElement('div');
    layer.className = 'erm-root';
    shadow.appendChild(layer);
    document.documentElement.appendChild(hostEl);
  }

  // прячем попап выбора цвета Excalidraw на те ~50 мс, пока подменяем цвет
  function ensureQuietStyle() {
    if (document.getElementById('erm-quiet-style')) return;
    const s = document.createElement('style');
    s.id = 'erm-quiet-style';
    s.textContent =
      'html.erm-quiet .Island:has(.color-picker-content),' +
      'html.erm-quiet .color-picker-content{opacity:0!important;pointer-events:none!important;}';
    document.head.appendChild(s);
  }

  function applyTheme() {
    const ex = document.querySelector('.excalidraw');
    let dark;
    if (cfg.theme === 'auto') {
      dark = ex ? ex.classList.contains('theme--dark')
                : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else dark = cfg.theme === 'dark';
    layer.classList.toggle('erm-dark', dark);
    if (ex) {
      const cs = getComputedStyle(ex);
      const accent = (cs.getPropertyValue('--color-primary') || '').trim();
      const island = (cs.getPropertyValue('--island-bg-color') || '').trim();
      if (accent) layer.style.setProperty('--erm-accent', accent);
      if (island) layer.style.setProperty('--erm-hub-1', island);
    }
  }

  /* ------------------------------------------- чтение состояния Excalidraw */
  function currentTool() {
    const b = document.querySelector('[data-testid^="toolbar-"][aria-pressed="true"]');
    return b ? b.getAttribute('data-testid').slice(8) : null;
  }

  // ряд «Обводка» или «Фон» в левой панели: узнаём его по составу top-picks
  function pickerRow() {
    const marker = cfg.colorTarget === 'background'
      ? 'color-top-pick-transparent' : 'color-top-pick-#1e1e1e';
    const tp = document.querySelector('[data-testid="' + marker + '"]');
    return tp ? tp.closest('.color-picker-container') : null;
  }
  function pickerTrigger() {
    const row = pickerRow();
    return row ? row.querySelector('.color-picker__button.active-color') : null;
  }
  function currentColor() {
    const t = pickerTrigger();
    return t ? (t.style.getPropertyValue('--swatch-color') || '').trim().toLowerCase() : null;
  }

  /* ------------------------------------------------------ выбор действия */
  function activate(id) {
    const t = ERM.TOOLS[id];
    if (!t) return;
    if (t.colorable) lastColorable = id;
    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) {
      try { a.blur(); } catch (e) { /* no-op */ }
    }
    if (t.click) { clickToolbar(t.click); return; }
    const init = {
      key: t.key, code: t.code, keyCode: t.keyCode, charCode: 0, which: t.keyCode,
      bubbles: true, cancelable: true, composed: true, view: window,
      shiftKey: !!t.shift, altKey: !!t.alt,
      ctrlKey: !!t.ctrl || !!(t.mod && !ERM.IS_MAC),
      metaKey: !!(t.mod && ERM.IS_MAC)
    };
    synthetic = true;
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', init));
      document.dispatchEvent(new KeyboardEvent('keyup', init));
    } finally { synthetic = false; }
  }

  // инструменты без горячей клавиши живут в выпадашке «ещё» — жмём их руками
  function clickToolbar(testid) {
    let el = document.querySelector('[data-testid="' + testid + '"]');
    if (el) { el.click(); return; }
    const bar = document.querySelector('.App-toolbar');
    const btns = bar && bar.querySelectorAll('button');
    if (!btns || !btns.length) return;
    btns[btns.length - 1].click();
    setTimeout(() => {
      const it = document.querySelector('[data-testid="' + testid + '"]');
      if (it) it.click();
      else document.body.click();
    }, 60);
  }

  /* Ставим цвет через штатный попап Excalidraw: открыть → вписать hex →
     закрыть. Попап на это время скрыт стилем, поэтому мигания не видно.
     Escape для закрытия использовать нельзя — он сбрасывает инструмент.   */
  function setColor(hex, allowToolFallback) {
    ensureQuietStyle();
    let trig = pickerTrigger();
    if (!trig) {
      // левая панель скрыта: ничего не выбрано и активен не рисующий инструмент
      if (allowToolFallback !== false && lastColorable) {
        activate(lastColorable);
        setTimeout(() => setColor(hex, false), 70);
      }
      return;
    }
    document.documentElement.classList.add('erm-quiet');
    trig.click();
    const done = () => {
      try { trig.click(); } catch (e) { /* no-op */ }
      document.documentElement.classList.remove('erm-quiet');
    };
    // ждём поле попапа таймером, а не rAF: в фоновой вкладке rAF не тикает
    let tries = 30;
    const waitInput = () => {
      const inp = document.querySelector('.color-picker-input');
      if (!inp) {
        if (--tries > 0) return setTimeout(waitInput, 16);
        return done();
      }
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, String(hex).replace('#', ''));
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      setTimeout(done, 30);
    };
    setTimeout(waitInput, 0);
  }

  /* ------------------------------------------------------ показ / скрытие */
  function placeWrap(w) {
    w.style.left = cx + 'px';
    w.style.top = cy + 'px';
  }

  function show() {
    ensureHost();
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
    clearDwell();
    subTool = null;
    layer.textContent = '';
    layer.style.removeProperty('--erm-accent');
    layer.style.removeProperty('--erm-hub-1');
    applyTheme();

    wheel = ERM.buildWheel(cfg, ERM.entriesFor(cfg.tools), {});
    layer.appendChild(wheel.wrap);

    const half = wheel.size / 2;
    if (cfg.followCursor) {
      cx = clamp(px, half + 6, window.innerWidth - half - 6);
      cy = clamp(py, half + 6, window.innerHeight - half - 46);
    } else {
      cx = window.innerWidth / 2;
      cy = window.innerHeight / 2;
    }
    placeWrap(wheel.wrap);
    wheel.setCurrent(currentTool());

    open = true; sticky = false; openedAt = performance.now();
    hostEl.style.pointerEvents = 'auto';
    updateHover();
  }

  function hide(commit) {
    if (!open) return;
    open = false; sticky = false;
    clearDwell();
    hostEl.style.pointerEvents = 'none';

    const idx = wheel.hover;
    const entry = idx >= 0 ? wheel.entries[idx] : null;
    if (commit) {
      if (subTool) {
        if (entry) wheel.flash(idx);
        activate(subTool);                                    // инструмент — всегда
        if (entry) setTimeout(() => setColor(entry.color), 70); // цвет — если не центр
      } else if (entry) {
        wheel.flash(idx);
        if (entry.isColor) setColor(entry.color);
        else activate(entry.id);
      }
    }
    subTool = null;

    const w = wheel.wrap;
    w.classList.add('erm-closing');
    closeTimer = setTimeout(() => { if (w.parentNode) w.remove(); closeTimer = 0; },
      Math.max(30, 260 / anim()));
  }

  function pick(idx) {
    if (!open || idx < 0 || idx >= wheel.entries.length) return;
    wheel.setHover(idx);
    hide(true);
  }

  /* --------------------------------------------- подменю выбора цвета */
  function clearDwell() {
    clearTimeout(dwellTimer);
    dwellTimer = 0; dwellIdx = -1;
    if (wheel) wheel.setDwell(-1, 0);
  }

  function armDwell(idx) {
    clearTimeout(dwellTimer);
    dwellIdx = idx; dwellX = px; dwellY = py;
    const e = idx >= 0 ? wheel.entries[idx] : null;
    if (subTool || !cfg.dwellMs || !e || !e.colorable) { wheel.setDwell(-1, 0); return; }
    wheel.setDwell(idx, cfg.dwellMs);
    dwellTimer = setTimeout(() => enterSub(e.id), cfg.dwellMs);
  }

  function enterSub(toolId) {
    if (!open || subTool) return;
    const t = ERM.TOOLS[toolId];
    if (!t) return;
    subTool = toolId;
    clearDwell();

    const oldWrap = wheel.wrap;
    oldWrap.classList.add('erm-imploding');
    setTimeout(() => { if (oldWrap.parentNode) oldWrap.remove(); }, Math.max(30, 220 / anim()));

    wheel = ERM.buildWheel(cfg, ERM.colorEntries(cfg.colors), {
      fillWedges: true, hubIcon: t.icon, hubLabel: t.label
    });
    wheel.wrap.classList.add('erm-blooming');
    placeWrap(wheel.wrap);
    layer.appendChild(wheel.wrap);
    const cur = currentColor();
    if (cur) wheel.setCurrent(ERM.colorId(cur));
    updateHover();
  }

  /* ------------------------------------------------------------- наведение */
  function updateHover() {
    if (!open) return;
    const dx = px - cx, dy = py - cy;
    const dist = Math.hypot(dx, dy);
    let idx = -1;
    if (dist >= cfg.deadzone) {
      let ang = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (ang < 0) ang += 360;
      idx = Math.round(ang / wheel.step) % wheel.entries.length;
      wheel.setNeedle(ang, true);
    } else {
      wheel.setNeedle(0, false);
    }
    const changed = idx !== wheel.hover;
    wheel.setHover(idx);
    if (!subTool && (changed || Math.hypot(px - dwellX, py - dwellY) > DWELL_TOL)) armDwell(idx);
  }

  /* -------------------------------------------------------------- события */
  const kill = (e) => { e.preventDefault(); e.stopImmediatePropagation(); };

  window.addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY;
    if (open) updateHover();
  }, { capture: true, passive: true });

  window.addEventListener('pointerdown', (e) => {
    px = e.clientX; py = e.clientY;
    if (!open) return;
    updateHover();
    kill(e);
    hide(true);
  }, true);

  ['pointerup', 'click', 'contextmenu', 'wheel'].forEach((type) => {
    window.addEventListener(type, (e) => { if (open) kill(e); },
      { capture: true, passive: false });
  });

  window.addEventListener('keydown', (e) => {
    if (synthetic) return;

    if (open) {
      if (e.code === 'Escape') { kill(e); hide(false); return; }
      if (cfg.quickNumbers && /^Digit[1-9]$/.test(e.code) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const i = +e.code.slice(5) - 1;
        if (i < wheel.entries.length) { kill(e); pick(i); return; }
      }
      const byKbd = wheel.entries.findIndex((en) =>
        en.kbd && en.kbd.length === 1 && en.kbd.toLowerCase() === (e.key || '').toLowerCase());
      if (byKbd >= 0 && !e.ctrlKey && !e.metaKey && !e.altKey) { kill(e); pick(byKbd); return; }
    }

    if (!ERM.triggerMatches(e, cfg.trigger)) return;
    const plain = !cfg.trigger.ctrl && !cfg.trigger.alt && !cfg.trigger.meta;
    if (!open && plain && editing() && /^(Key|Digit)/.test(cfg.trigger.code)) return;

    kill(e);
    if (e.repeat) return;

    if (isCaps()) { open ? hide(true) : show(); return; }
    if (!open) show();
    else if (cfg.mode === 'toggle' || sticky) hide(true);   // повторное нажатие = выбор
  }, true);

  window.addEventListener('keyup', (e) => {
    if (synthetic) return;
    if (!ERM.triggerMatches(e, cfg.trigger)) return;
    kill(e);

    if (isCaps()) {
      // Windows/Linux шлют keyup сразу же — это не «отпускание», игнорируем
      if (open && performance.now() - openedAt < 260) { sticky = true; return; }
      open ? hide(true) : show();
      return;
    }
    if (!open) return;
    const held = performance.now() - openedAt;
    if (cfg.mode === 'hold') hide(true);
    else if (cfg.mode === 'auto') {
      if (held >= cfg.tapMs) hide(true);
      else sticky = true;            // короткий тап — меню остаётся висеть
    }
  }, true);

  window.addEventListener('blur', () => { if (open) hide(false); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && open) hide(false); });
})();

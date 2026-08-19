/* Excalidraw Radial Menu — общий модуль (иконки, инструменты, палитра,
   геометрия колеса, стили). Используется content-скриптом и настройками. */
(function (root) {
  'use strict';

  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform) || /Mac/.test(navigator.userAgent);

  /* Все видимые строки живут в _locales/<lang>/messages.json.
     Чтобы добавить язык, достаточно положить рядом ещё одну папку с messages.json. */
  const t = (key, subs) => {
    try { return chrome.i18n.getMessage(key, subs) || ''; } catch (e) { return ''; }
  };

  /* ------------------------------------------------------------------ иконки
     24x24, обводка currentColor, в стиле Excalidraw / tabler-icons        */
  const ICONS = {
    selection: '<path d="M7.9 17.6a1.2 1.2 0 0 0 2.23.3l2.09-3.09 4.9 4.9a1.07 1.07 0 0 0 1.51 0l1.05-1.04a1.07 1.07 0 0 0 0-1.51l-4.91-4.91 3.11-2.09a1.2 1.2 0 0 0-.31-2.23L4 4.03l3.9 13.57z"/>',
    lasso: '<path d="M12 4.5c4.7 0 8.5 2.9 8.5 6.4 0 2.4-1.7 4.5-4.3 5.6"/><path d="M12 17.3c-4.7 0-8.5-2.9-8.5-6.4 0-2 1.2-3.8 3.1-5"/><path d="M9.4 17.1c-.6 1.6-1.3 2.8-2 3.4a1.6 1.6 0 0 1-2.6-1.4c.1-1.3 1.2-2.2 2.6-2.2 1.5 0 3 .5 4.6.4"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 5.5v-2a1.5 1.5 0 1 1 3 0V12"/><path d="M14 5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M17 7.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.2-3c-.3-.5-1.4-2.4-3.3-5.7a1.5 1.5 0 0 1 .5-2.1 1.6 1.6 0 0 1 2 .3L8 13.5"/>',
    rectangle: '<rect x="3.5" y="4.5" width="17" height="15" rx="3.2"/>',
    diamond: '<path d="M10.4 3.3 3.3 10.4a2.2 2.2 0 0 0 0 3.2l7.1 7.1a2.2 2.2 0 0 0 3.2 0l7.1-7.1a2.2 2.2 0 0 0 0-3.2l-7.1-7.1a2.2 2.2 0 0 0-3.2 0z"/>',
    ellipse: '<circle cx="12" cy="12" r="8.6"/>',
    arrow: '<path d="M4 12h15"/><path d="M13.2 6 19.5 12l-6.3 6"/>',
    line: '<path d="M4.5 19.5 19.5 4.5"/>',
    freedraw: '<path d="M4 20h4L18.5 9.5a2.83 2.83 0 1 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    text: '<path d="M6 4.5h12"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>',
    image: '<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.6" cy="10" r="1.6"/><path d="M4 17.5l4.6-4.6 3.4 3.4 3.2-3.2 4.8 4.8"/>',
    eraser: '<path d="M19 20H8.5l-4.2-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4L11.5 20"/><path d="M18 13.3 11.7 7"/>',
    frame: '<path d="M4 8h16"/><path d="M4 16h16"/><path d="M8 4v16"/><path d="M16 4v16"/>',
    laser: '<circle cx="12" cy="12" r="2.2"/><path d="M12 2.5v2.4"/><path d="M12 19.1v2.4"/><path d="M2.5 12h2.4"/><path d="M19.1 12h2.4"/><path d="M5.2 5.2 6.9 6.9"/><path d="M17.1 17.1l1.7 1.7"/><path d="M5.2 18.8 6.9 17.1"/><path d="M17.1 6.9l1.7-1.7"/>',
    bucketfill: '<path d="M18.5 11.2 10.7 3.4 3.3 10.8a2 2 0 0 0 0 2.8l4.9 4.9a2 2 0 0 0 2.8 0l7.5-7.3z"/><path d="M5.4 2.6 9.6 6.8"/><path d="M20.2 15.4s1.8 2.3 1.8 3.6a1.8 1.8 0 1 1-3.6 0c0-1.3 1.8-3.6 1.8-3.6z"/>',
    autoshape: '<path d="M3 16.5c1.6-3.4 3.4-5.1 5.4-5.1 1.5 0 2.2 1.6.8 2.6-1.3 1-2.4-.4-1.4-2.1C9.2 9.4 11 7.5 13 6.5"/><rect x="13.5" y="12.5" width="8" height="8" rx="1.6"/><path d="M17 2.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
    embeddable: '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="M3 9.2h18"/><path d="M6.4 6.9h.01"/><path d="M9 6.9h.01"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H9"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H15"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5.5 7l.9 12.1A2 2 0 0 0 8.4 21h7.2a2 2 0 0 0 2-1.9L18.5 7"/><path d="M9 7V4.5h6V7"/>',
    zoomfit: '<path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9"/><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9"/><path d="M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/><rect x="8" y="8" width="8" height="8" rx="1.4"/>',
    duplicate: '<rect x="8" y="8" width="12" height="12" rx="2.4"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    group: '<rect x="4" y="4" width="7" height="7" rx="1.4"/><rect x="13" y="13" width="7" height="7" rx="1.4"/><path d="M11 7.5h3.5A1.5 1.5 0 0 1 16 9v4"/>',
    palette: '<path d="M12 21a9 9 0 1 1 9-9c0 1.7-1.3 3-3 3h-1.5a2 2 0 0 0-1.4 3.4A2 2 0 0 1 12 21z"/><circle cx="7.5" cy="12" r="1.1"/><circle cx="9.8" cy="7.8" r="1.1"/><circle cx="14.4" cy="7.6" r="1.1"/>',
    cross: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>'
  };

  /* ------------------------------------------------------- список действий
     key/code/keyCode — то, что реально слушает Excalidraw.
     click — data-testid кнопки (для инструментов без горячей клавиши).
     colorable — у инструмента есть цвет обводки, значит доступно подменю.   */
  const TOOLS = {
    freedraw:   { icon: 'freedraw',   kbd: 'P',  key: 'p', code: 'KeyP', keyCode: 80, colorable: true, lockable: true },
    eraser:     { icon: 'eraser',     kbd: 'E',  key: 'e', code: 'KeyE', keyCode: 69 },
    selection:  { icon: 'selection',  kbd: 'V',  key: 'v', code: 'KeyV', keyCode: 86 },
    lasso:      { icon: 'lasso',      kbd: '',   click: 'toolbar-lasso' },
    hand:       { icon: 'hand',       kbd: 'H',  key: 'h', code: 'KeyH', keyCode: 72 },
    rectangle:  { icon: 'rectangle',  kbd: 'R',  key: 'r', code: 'KeyR', keyCode: 82, colorable: true, lockable: true },
    diamond:    { icon: 'diamond',    kbd: 'D',  key: 'd', code: 'KeyD', keyCode: 68, colorable: true, lockable: true },
    ellipse:    { icon: 'ellipse',    kbd: 'O',  key: 'o', code: 'KeyO', keyCode: 79, colorable: true, lockable: true },
    arrow:      { icon: 'arrow',      kbd: 'A',  key: 'a', code: 'KeyA', keyCode: 65, colorable: true, lockable: true },
    line:       { icon: 'line',       kbd: 'L',  key: 'l', code: 'KeyL', keyCode: 76, colorable: true, lockable: true },
    text:       { icon: 'text',       kbd: 'T',  key: 't', code: 'KeyT', keyCode: 84, colorable: true, lockable: true },
    image:      { icon: 'image',      kbd: '9',  key: '9', code: 'Digit9', keyCode: 57, lockable: true },
    frame:      { icon: 'frame',      kbd: 'F',  key: 'f', code: 'KeyF', keyCode: 70, lockable: true },
    laser:      { icon: 'laser',      kbd: 'K',  key: 'k', code: 'KeyK', keyCode: 75 },
    bucketfill: { icon: 'bucketfill', kbd: 'B',  key: 'b', code: 'KeyB', keyCode: 66, lockable: true },
    autoshape:  { icon: 'autoshape',  kbd: '⇧X', key: 'X', code: 'KeyX', keyCode: 88, shift: true, lockable: true },
    embeddable: { icon: 'embeddable', kbd: '',   click: 'toolbar-embeddable', lockable: true },
    undo:       { icon: 'undo',       kbd: IS_MAC ? '⌘Z' : 'Ctrl+Z',   key: 'z', code: 'KeyZ', keyCode: 90, mod: true },
    redo:       { icon: 'redo',       kbd: IS_MAC ? '⇧⌘Z' : 'Ctrl+⇧Z', key: 'z', code: 'KeyZ', keyCode: 90, mod: true, shift: true },
    del:        { icon: 'trash',      kbd: '⌫',  key: 'Backspace', code: 'Backspace', keyCode: 8 },
    duplicate:  { icon: 'duplicate',  kbd: IS_MAC ? '⌘D' : 'Ctrl+D',   key: 'd', code: 'KeyD', keyCode: 68, mod: true },
    group:      { icon: 'group',      kbd: IS_MAC ? '⌘G' : 'Ctrl+G',   key: 'g', code: 'KeyG', keyCode: 71, mod: true },
    zoomfit:    { icon: 'zoomfit',    kbd: '⇧1', key: '!', code: 'Digit1', keyCode: 49, shift: true }
  };

  Object.keys(TOOLS).forEach((id) => { TOOLS[id].label = t('tool_' + id) || id; });

  const TOOL_ORDER = ['freedraw', 'eraser', 'selection', 'lasso', 'hand', 'rectangle', 'diamond', 'ellipse',
    'arrow', 'line', 'text', 'image', 'frame', 'laser', 'bucketfill', 'autoshape', 'embeddable',
    'undo', 'redo', 'del', 'duplicate', 'group', 'zoomfit'];

  /* ------------------------------------------------------------- палитра */
  const DEFAULT_COLORS = ['#1e1e1e', '#e03131', '#f08c00', '#2f9e44', '#0c8599', '#1971c2', '#6741d9', '#c2255c'];

  const colorName = (hex) => {
    const h = String(hex).toLowerCase();
    return t('color_' + h.replace('#', '')) || h.toUpperCase();
  };

  const isColorId = (id) => typeof id === 'string' && id.slice(0, 6) === 'color:';
  const colorId = (hex) => 'color:' + String(hex).toLowerCase();
  const colorOf = (id) => id.slice(6);

  /* Запись колеса: {id, label, kbd, icon, color}. Инструмент или цвет. */
  function entryFor(id) {
    if (isColorId(id)) {
      const hex = colorOf(id);
      return { id, label: colorName(hex), kbd: '', color: hex, isColor: true };
    }
    const t = TOOLS[id];
    if (!t) return null;
    return { id, label: t.label, kbd: t.kbd, icon: t.icon, colorable: !!t.colorable };
  }
  const entriesFor = (ids) => (ids || []).map(entryFor).filter(Boolean);
  const colorEntries = (colors) => (colors && colors.length ? colors : DEFAULT_COLORS).map((h) => entryFor(colorId(h)));

  const DEFAULTS = {
    trigger: { code: 'CapsLock', key: 'CapsLock', ctrl: false, alt: false, shift: false, meta: false },
    mode: 'auto',              // auto | hold | toggle
    mouseTrigger: 'off',       // off | right | middle — открытие кнопкой мыши
    tapMs: 220,
    tools: ['freedraw', 'eraser', 'selection', 'text', 'rectangle', 'ellipse', 'arrow', 'undo'],
    colors: DEFAULT_COLORS.slice(),
    dwellMs: 350,              // 0 = подменю цвета выключено
    colorTarget: 'stroke',     // stroke | background
    keepTool: true,            // держать «замок» Excalidraw включённым
    radius: 120,
    innerRatio: 0.45,
    gapPx: 8,
    deadzone: 34,
    animSpeed: 1,              // 0 = без анимации
    theme: 'auto',             // auto | dark | light
    showKbd: true,
    followCursor: true,
    closeOnSelect: true,
    quickNumbers: true
  };

  /* --------------------------------------------------------------- утилиты */
  function polar(cx, cy, r, deg) {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  const f = (n) => Math.round(n * 100) / 100;
  const degFor = (px, r) => (px / r) * 180 / Math.PI;

  function wedgePath(cx, cy, r0, r1, aC, halfStep, gapPx) {
    // угловой полу-зазор считаем отдельно для внутреннего и внешнего радиуса —
    // так просвет между секторами остаётся постоянным в пикселях
    const g1 = Math.min(halfStep - 0.5, degFor(gapPx / 2, r1));
    const g0 = Math.min(halfStep - 0.5, degFor(gapPx / 2, r0));
    const a1s = aC - halfStep + g1, a1e = aC + halfStep - g1;
    const a0s = aC - halfStep + g0, a0e = aC + halfStep - g0;
    const large = (a1e - a1s) > 180 ? 1 : 0;
    const p1s = polar(cx, cy, r1, a1s), p1e = polar(cx, cy, r1, a1e);
    const p0e = polar(cx, cy, r0, a0e), p0s = polar(cx, cy, r0, a0s);
    return `M${f(p1s[0])} ${f(p1s[1])}` +
           `A${f(r1)} ${f(r1)} 0 ${large} 1 ${f(p1e[0])} ${f(p1e[1])}` +
           `L${f(p0e[0])} ${f(p0e[1])}` +
           `A${f(r0)} ${f(r0)} 0 ${large} 0 ${f(p0s[0])} ${f(p0s[1])}Z`;
  }

  function arcPath(cx, cy, r, aFrom, aTo) {
    const p0 = polar(cx, cy, r, aFrom), p1 = polar(cx, cy, r, aTo);
    const large = (aTo - aFrom) > 180 ? 1 : 0;
    return `M${f(p0[0])} ${f(p0[1])}A${f(r)} ${f(r)} 0 ${large} 1 ${f(p1[0])} ${f(p1[1])}`;
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, html) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ------------------------------------------------------- сборка колеса
     entries — массив записей (инструменты и/или цвета)
     opts.hubIcon — иконка, залипшая в ступице (режим подменю цвета)
     opts.fillWedges — заливать сектор самим цветом (режим подменю цвета)   */
  function buildWheel(cfg, entries, opts) {
    opts = opts || {};
    const list = entries && entries.length ? entries : entriesFor(DEFAULTS.tools);
    const n = list.length;
    const R1 = cfg.radius;
    const R0 = Math.round(R1 * cfg.innerRatio);
    const PAD = 30;
    const S = (R1 + PAD) * 2;
    const C = S / 2;
    const step = 360 / n;
    const half = step / 2;
    const ringW = R1 - R0;
    const withKbd = cfg.showKbd && list.some((e) => e.kbd);
    const iconR = R0 + ringW * (withKbd ? 0.40 : 0.5);
    const kbdR = R0 + ringW * 0.80;
    const iconScale = Math.max(0.85, Math.min(1.35, ringW / 60));
    const dotR = Math.max(9, Math.min(18, ringW * 0.26));

    const wrap = document.createElement('div');
    wrap.className = 'erm-wrap' + (opts.fillWedges ? ' erm-colors' : '');
    wrap.style.setProperty('--erm-size', S + 'px');
    wrap.style.setProperty('--erm-r1', R1 + 'px');
    wrap.style.setProperty('--erm-speed', String(cfg.animSpeed || 0.0001));

    const glass = document.createElement('div');
    glass.className = 'erm-glass';
    wrap.appendChild(glass);

    const svg = el('svg', { class: 'erm-svg', viewBox: `0 0 ${S} ${S}`, width: S, height: S });
    svg.appendChild(el('defs', {}, `
      <filter id="ermGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="ermHubG" cx="50%" cy="35%" r="75%">
        <stop class="erm-hs1" offset="0%"/>
        <stop class="erm-hs2" offset="100%"/>
      </radialGradient>`));

    const needle = el('g', { class: 'erm-needle' });
    needle.appendChild(el('path', { d: `M${C - 5} ${C - R0 + 13} L${C} ${C - R0 + 4} L${C + 5} ${C - R0 + 13} Z` }));
    svg.appendChild(needle);

    const sectors = [];
    const gSec = el('g', { class: 'erm-sectors' });
    list.forEach((e, i) => {
      const aC = i * step;
      const dx = Math.cos((aC - 90) * Math.PI / 180);
      const dy = Math.sin((aC - 90) * Math.PI / 180);
      const g = el('g', { class: 'erm-sec' + (e.isColor ? ' erm-sec-color' : ''), 'data-id': e.id });
      g.style.setProperty('--i', i);
      const inner = el('g', { class: 'erm-sec-in' });
      inner.style.setProperty('--dx', f(dx));
      inner.style.setProperty('--dy', f(dy));

      const wedge = el('path', { class: 'erm-wedge', d: wedgePath(C, C, R0, R1, aC, half, cfg.gapPx) });
      if (e.isColor && opts.fillWedges) {
        wedge.style.fill = e.color;
        g.style.setProperty('--erm-own', e.color);
      }
      inner.appendChild(wedge);

      const [ix, iy] = polar(C, C, opts.fillWedges ? (R0 + R1) / 2 : iconR, aC);
      if (e.isColor && !opts.fillWedges) {
        // цвет как обычный пункт колеса инструментов — рисуем кружком
        const dot = el('circle', { class: 'erm-dot', cx: f(ix), cy: f(iy), r: f(dotR) });
        dot.style.fill = e.color;
        inner.appendChild(dot);
      } else if (!e.isColor) {
        inner.appendChild(el('g', {
          class: 'erm-ico',
          transform: `translate(${f(ix)} ${f(iy)}) scale(${f(iconScale)}) translate(-12 -12)`
        }, ICONS[e.icon] || ICONS.rectangle));
      }

      if (cfg.showKbd && e.kbd) {
        const [kx, ky] = polar(C, C, kbdR, aC);
        const tx = el('text', { class: 'erm-kbd', x: f(kx), y: f(ky) });
        tx.textContent = e.kbd;
        inner.appendChild(tx);
      }
      g.appendChild(inner);
      gSec.appendChild(g);
      sectors.push({ entry: e, g, inner, aC, dx, dy });
    });
    svg.appendChild(gSec);

    // дуга прогресса удержания (появляется на секторе, у которого есть подменю)
    const dwellArc = el('path', { class: 'erm-dwell', d: '' });
    svg.appendChild(dwellArc);

    svg.appendChild(el('circle', { class: 'erm-hub', cx: C, cy: C, r: R0 - 7 }));
    const hubIco = el('g', { class: 'erm-hubico' });
    svg.appendChild(hubIco);
    wrap.appendChild(svg);

    const label = document.createElement('div');
    label.className = 'erm-label';
    label.innerHTML = '<span class="erm-label-name"></span><span class="erm-label-kbd"></span>';
    wrap.appendChild(label);

    let hover = -2;
    const hubScale = Math.max(1.1, (R0 - 18) / 12);
    const setHubIcon = (icon, scale) => {
      hubIco.setAttribute('transform',
        `translate(${C} ${C}) scale(${f(hubScale / scale)}) translate(-12 -12)`);
      hubIco.innerHTML = ICONS[icon] || '';
    };

    function setHover(idx) {
      if (idx === hover) return;
      hover = idx;
      sectors.forEach((s, i) => s.g.classList.toggle('on', i === idx));
      const e = idx >= 0 ? sectors[idx].entry : null;
      const nameEl = label.querySelector('.erm-label-name');
      const kbdEl = label.querySelector('.erm-label-kbd');

      if (!e) {
        // мёртвая зона: в подменю это «оставить цвет», в колесе — отмена
        setHubIcon(opts.hubIcon || 'cross', 1.9);
        hubIco.style.stroke = '';
        hubIco.classList.toggle('cancel', !opts.hubIcon);
        nameEl.textContent = opts.hubIcon
          ? t('wheelKeepColor', [opts.hubLabel || ''])
          : t('wheelCancel');
        kbdEl.textContent = '';
        label.classList.add('on', 'cancel');
        return;
      }
      setHubIcon(opts.hubIcon || e.icon || 'palette', 1.7);
      hubIco.classList.remove('cancel');
      hubIco.style.stroke = e.isColor ? e.color : '';
      nameEl.textContent = opts.hubLabel
        ? t('wheelToolAndColor', [opts.hubLabel, e.label])
        : e.label;
      kbdEl.textContent = e.kbd || '';
      label.classList.add('on');
      label.classList.remove('cancel');
    }
    setHover(-1);

    function setNeedle(deg, visible) {
      needle.style.transform = `rotate(${f(deg)}deg)`;
      needle.style.opacity = visible ? '1' : '0';
    }
    setNeedle(0, false);

    function setCurrent(id) {
      sectors.forEach((s) => s.g.classList.toggle('cur', s.entry.id === id));
    }

    /* дуга удержания: ms > 0 — запустить заполнение, 0 — снять */
    function setDwell(idx, ms) {
      if (idx < 0 || !sectors[idx] || !ms) {
        dwellArc.style.transition = 'none';
        dwellArc.style.opacity = '0';
        dwellArc.setAttribute('d', '');
        return;
      }
      const aC = sectors[idx].aC;
      const r = R1 + 5;
      const g1 = degFor(cfg.gapPx / 2, r);
      const a0 = aC - half + g1, a1 = aC + half - g1;
      const len = (a1 - a0) * Math.PI / 180 * r;
      dwellArc.setAttribute('d', arcPath(C, C, r, a0, a1));
      dwellArc.style.transition = 'none';
      dwellArc.style.strokeDasharray = f(len);
      dwellArc.style.strokeDashoffset = f(len);
      dwellArc.style.opacity = '1';
      // следующий кадр — запускаем плавное заполнение
      setTimeout(() => {
        dwellArc.style.transition = `stroke-dashoffset ${ms}ms linear`;
        dwellArc.style.strokeDashoffset = '0';
      }, 16);
    }

    function flash(idx) {
      if (sectors[idx]) sectors[idx].g.classList.add('picked');
    }

    return {
      wrap, svg, size: S, center: C, R0, R1, step, sectors,
      entries: list, ids: list.map((e) => e.id),
      setHover, setNeedle, setCurrent, setDwell, flash,
      get hover() { return hover; }
    };
  }

  /* --------------------------------------------------------- горячая клавиша */
  const MOD_CODES = /^(Shift|Control|Alt|Meta|Caps)/;

  function triggerMatches(e, tr) {
    if (!tr) return false;
    const code = e.code || '';
    const same = tr.code ? code === tr.code : (e.key || '').toLowerCase() === (tr.key || '').toLowerCase();
    if (!same) return false;
    if (MOD_CODES.test(code)) return true;
    return !!tr.ctrl === e.ctrlKey && !!tr.alt === e.altKey &&
           !!tr.shift === e.shiftKey && !!tr.meta === e.metaKey;
  }

  function triggerLabel(tr) {
    if (!tr || !tr.code) return '—';
    const parts = [];
    if (tr.ctrl) parts.push(IS_MAC ? '⌃' : 'Ctrl');
    if (tr.alt) parts.push(IS_MAC ? '⌥' : 'Alt');
    if (tr.shift) parts.push(IS_MAC ? '⇧' : 'Shift');
    if (tr.meta) parts.push(IS_MAC ? '⌘' : 'Win');
    parts.push(keyName(tr));
    return parts.join(IS_MAC ? '' : ' + ');
  }

  function keyName(tr) {
    const c = tr.code || '';
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit\d$/.test(c)) return c.slice(5);
    if (/^Numpad/.test(c)) return 'Num ' + c.slice(6);
    const map = {
      CapsLock: 'Caps Lock', Space: 'Space', Escape: 'Esc', Tab: 'Tab', Backquote: '`',
      ShiftLeft: 'Shift', ShiftRight: 'Shift (пр.)', ControlLeft: 'Ctrl', ControlRight: 'Ctrl (пр.)',
      AltLeft: IS_MAC ? '⌥ Option' : 'Alt', AltRight: IS_MAC ? '⌥ Option (пр.)' : 'Alt (пр.)',
      MetaLeft: IS_MAC ? '⌘ Cmd' : 'Win', MetaRight: IS_MAC ? '⌘ Cmd (пр.)' : 'Win (пр.)',
      Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
      Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/'
    };
    return map[c] || c;
  }

  /* --------------------------------------------------------------- стили */
  const CSS = `
:host, .erm-root { all: initial; }
.erm-root{
  position: fixed; inset: 0; z-index: 2147483600;
  pointer-events: none;
  font: 500 13px/1.2 "Assistant", "Segoe UI", system-ui, -apple-system, sans-serif;
  --erm-wedge:      rgba(255,255,255,.93);
  --erm-ink:        #1b1b1f;
  --erm-ink-dim:    #7a7a89;
  --erm-accent:     #6965db;
  --erm-accent-ink: #ffffff;
  --erm-hub-1:      rgba(255,255,255,.97);
  --erm-hub-2:      rgba(240,240,248,.93);
  --erm-stroke:     rgba(0,0,0,.08);
  --erm-shadow:     0 12px 40px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.10);
}
.erm-root.erm-dark{
  --erm-wedge:      rgba(50,50,61,.93);
  --erm-ink:        #e6e6ee;
  --erm-ink-dim:    #8f8fa3;
  --erm-accent:     #a8a5ff;
  --erm-accent-ink: #1b1b22;
  --erm-hub-1:      rgba(42,42,52,.98);
  --erm-hub-2:      rgba(28,28,36,.95);
  --erm-stroke:     rgba(255,255,255,.08);
  --erm-shadow:     0 14px 44px rgba(0,0,0,.55), 0 2px 10px rgba(0,0,0,.4);
}
.erm-wrap{
  position: absolute; width: var(--erm-size); height: var(--erm-size);
  margin-left: calc(var(--erm-size) / -2); margin-top: calc(var(--erm-size) / -2);
  pointer-events: none; will-change: transform, opacity;
  animation: erm-in calc(260ms / var(--erm-speed)) cubic-bezier(.16,1.06,.3,1.02) both;
}
.erm-wrap.erm-closing{ animation: erm-out calc(150ms / var(--erm-speed)) cubic-bezier(.4,0,.7,.2) both; }
/* уход колеса инструментов внутрь ступицы при входе в подменю цвета */
.erm-wrap.erm-imploding{ animation: erm-implode calc(190ms / var(--erm-speed)) cubic-bezier(.5,0,.75,0) both; }
/* приход колеса цветов из ступицы */
.erm-wrap.erm-blooming{ animation: erm-bloom-in calc(300ms / var(--erm-speed)) cubic-bezier(.16,1.1,.3,1.02) both; }
@keyframes erm-in       { from { opacity: 0; transform: scale(.72); } to { opacity: 1; transform: scale(1); } }
@keyframes erm-out      { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.09); } }
@keyframes erm-implode  { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(.34); } }
@keyframes erm-bloom-in { from { opacity: 0; transform: scale(.34) rotate(-14deg); } to { opacity: 1; transform: scale(1) rotate(0); } }

.erm-glass{
  position: absolute; left: 50%; top: 50%;
  width: calc(var(--erm-r1) * 2 + 6px); height: calc(var(--erm-r1) * 2 + 6px);
  transform: translate(-50%,-50%); border-radius: 50%;
  backdrop-filter: blur(13px) saturate(1.25); -webkit-backdrop-filter: blur(13px) saturate(1.25);
  box-shadow: var(--erm-shadow);
}
.erm-svg{ position: absolute; inset: 0; overflow: visible; display: block; }
.erm-hs1{ stop-color: var(--erm-hub-1); }
.erm-hs2{ stop-color: var(--erm-hub-2); }
.erm-sectors{ filter: drop-shadow(0 2px 3px rgba(0,0,0,.10)); }
.erm-root.erm-dark .erm-sectors{ filter: drop-shadow(0 3px 5px rgba(0,0,0,.38)); }

.erm-sec{
  animation: erm-petal calc(320ms / var(--erm-speed)) cubic-bezier(.18,1.2,.35,1) both;
  animation-delay: calc(var(--i) * 22ms / var(--erm-speed));
  transform-box: view-box; transform-origin: 50% 50%;
}
@keyframes erm-petal { from { opacity: 0; transform: scale(.55) } to { opacity: 1; transform: scale(1) } }

.erm-sec-in{ transition: transform 160ms cubic-bezier(.2,.9,.25,1.3); }
.erm-wedge{
  fill: var(--erm-wedge); stroke: var(--erm-stroke); stroke-width: 1;
  transition: fill 130ms ease, filter 130ms ease;
}
.erm-dot{ stroke: rgba(0,0,0,.14); stroke-width: 1.5; transition: r 140ms cubic-bezier(.2,.9,.3,1.4); }
.erm-root.erm-dark .erm-dot{ stroke: rgba(255,255,255,.22); }
.erm-ico{
  fill: none; stroke: var(--erm-ink); stroke-width: 1.9;
  stroke-linecap: round; stroke-linejoin: round;
  transition: stroke 130ms ease;
}
.erm-kbd{
  fill: var(--erm-ink-dim); font-size: 10.5px; font-weight: 700; letter-spacing: .3px;
  text-anchor: middle; dominant-baseline: middle; transition: fill 130ms ease;
}
.erm-sec.cur .erm-wedge{ stroke: var(--erm-accent); stroke-width: 1.6; }
.erm-sec.cur .erm-ico{ stroke: var(--erm-accent); }
.erm-sec.cur .erm-dot{ stroke: var(--erm-accent); stroke-width: 2.4; }

.erm-sec.on .erm-sec-in{ transform: translate(calc(var(--dx) * 8px), calc(var(--dy) * 8px)); }
.erm-sec.on .erm-wedge{ fill: var(--erm-accent); stroke: transparent; filter: url(#ermGlow); }
.erm-sec.on .erm-ico{ stroke: var(--erm-accent-ink); stroke-width: 2.15; }
.erm-sec.on .erm-kbd{ fill: var(--erm-accent-ink); opacity: .8; }
.erm-sec.on .erm-dot{ stroke: #fff; stroke-width: 2.5; }
/* в подменю цвета сектор уже покрашен в свой цвет — акцентом его не перебиваем,
   вместо этого гасим соседей и обводим выбранный белым */
.erm-colors .erm-wedge{ opacity: .82; transition: opacity 130ms ease, stroke-width 130ms ease; }
.erm-colors .erm-sec.on .erm-sec-in{ transform: translate(calc(var(--dx) * 11px), calc(var(--dy) * 11px)); }
.erm-colors .erm-sec.on .erm-wedge{
  fill: var(--erm-own); opacity: 1; stroke: #fff; stroke-width: 3; filter: url(#ermGlow);
}
.erm-root.erm-dark .erm-colors .erm-sec.on .erm-wedge{ stroke: #fff; }
.erm-colors .erm-sec.cur .erm-wedge{ stroke: #fff; stroke-width: 2.4; stroke-dasharray: 4 5; opacity: .95; }
.erm-colors .erm-sec.cur.on .erm-wedge{ stroke-dasharray: none; }
.erm-sec.picked{ animation: erm-pick calc(200ms / var(--erm-speed)) ease-out both; }
@keyframes erm-pick { 0% { transform: scale(1) } 45% { transform: scale(1.10) } 100% { transform: scale(1.03); opacity: .55 } }

.erm-dwell{
  fill: none; stroke: var(--erm-accent); stroke-width: 3; stroke-linecap: round;
  opacity: 0; pointer-events: none;
}
.erm-hub{ fill: url(#ermHubG); stroke: var(--erm-stroke); stroke-width: 1;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.12)); }
.erm-hubico{
  fill: none; stroke: var(--erm-accent); stroke-width: 2;
  stroke-linecap: round; stroke-linejoin: round;
  transition: stroke 140ms ease, opacity 140ms ease;
}
.erm-hubico.cancel{ stroke: var(--erm-ink-dim); opacity: .55; }

.erm-needle{
  fill: var(--erm-accent); opacity: 0;
  transform-box: view-box; transform-origin: 50% 50%;
  transition: transform 90ms cubic-bezier(.2,.8,.3,1), opacity 140ms ease;
}
.erm-label{
  position: absolute; left: 50%; top: calc(50% + var(--erm-r1) + 16px);
  transform: translate(-50%, 0) scale(.94); transform-origin: top center;
  display: flex; align-items: center; gap: 8px; white-space: nowrap;
  padding: 6px 12px; border-radius: 999px;
  background: var(--erm-hub-1); box-shadow: var(--erm-shadow);
  color: var(--erm-ink); font-size: 13px; font-weight: 600;
  opacity: 0; transition: opacity 140ms ease, transform 160ms cubic-bezier(.2,.9,.3,1.2);
}
.erm-label.on{ opacity: 1; transform: translate(-50%, 0) scale(1); }
.erm-label.cancel{ opacity: .62; color: var(--erm-ink-dim); }
.erm-label-kbd{
  font-size: 11px; font-weight: 700; color: var(--erm-ink-dim);
  border: 1px solid var(--erm-stroke); border-radius: 5px; padding: 1px 5px;
}
.erm-label-kbd:empty{ display: none; }
@media (prefers-reduced-motion: reduce){
  .erm-wrap, .erm-sec{ animation-duration: 1ms !important; }
}`;

  root.ERM = {
    ICONS, TOOLS, TOOL_ORDER, DEFAULTS, DEFAULT_COLORS, CSS, IS_MAC, t,
    buildWheel, entryFor, entriesFor, colorEntries, colorName, colorId, colorOf, isColorId,
    triggerMatches, triggerLabel, keyName
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* Excalidraw Radial Menu — страница настроек */
(function () {
  'use strict';
  const E = window.ERM;
  const { DEFAULTS, TOOLS, TOOL_ORDER, ICONS, CSS, IS_MAC } = E;
  const $ = (id) => document.getElementById(id);
  let cfg = Object.assign({}, DEFAULTS);
  let wheel = null, saveTimer = 0, previewColors = false;

  /* ------------------------------------------------------------ хранение */
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      chrome.storage.sync.set(cfg, () => {
        const s = $('saved');
        s.classList.add('on');
        setTimeout(() => s.classList.remove('on'), 1100);
      });
    }, 120);
  }

  /* ------------------------------------------------------------- превью */
  const host = $('preview');
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const layer = document.createElement('div');
  layer.className = 'erm-root';
  host.appendChild(layer);

  function renderWheel() {
    const dark = cfg.theme === 'dark' ||
      (cfg.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    layer.classList.toggle('erm-dark', dark);
    layer.textContent = '';
    wheel = previewColors
      ? E.buildWheel(cfg, E.colorEntries(cfg.colors),
          { fillWedges: true, hubIcon: 'freedraw', hubLabel: 'Карандаш' })
      : E.buildWheel(cfg, E.entriesFor(cfg.tools), {});
    wheel.wrap.style.left = '50%';
    wheel.wrap.style.top = '50%';
    layer.appendChild(wheel.wrap);
    wheel.setCurrent(previewColors ? E.colorId(cfg.colors[0] || '#1e1e1e') : cfg.tools[0]);
    $('previewMode').textContent = previewColors ? 'показать инструменты' : 'показать палитру';
  }

  $('previewMode').addEventListener('click', () => {
    previewColors = !previewColors;
    closeSlot();
    $('addSlot').textContent = previewColors ? '+ добавить цвет' : '+ добавить сектор';
    $('slotHint').textContent = previewColors
      ? 'клик — сменить цвет · перетащить — переставить'
      : 'клик — сменить инструмент · перетащить — переставить';
    renderWheel();
  });

  /* индекс сектора под курсором — та же математика, что и в самом меню */
  function idxAt(clientX, clientY) {
    if (!wheel) return -1;
    const r = host.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < cfg.deadzone) return -1;
    let a = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (a < 0) a += 360;
    return Math.round(a / wheel.step) % wheel.entries.length;
  }
  function angleAt(clientX, clientY) {
    const r = host.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    let a = Math.atan2(dx, -dy) * 180 / Math.PI;
    return a < 0 ? a + 360 : a;
  }

  let dragFrom = -1, dragMoved = false, downX = 0, downY = 0;

  host.addEventListener('mousemove', (e) => {
    if (!wheel || !$('slotPicker').hidden) return;
    const i = idxAt(e.clientX, e.clientY);
    wheel.setHover(i);
    wheel.setNeedle(angleAt(e.clientX, e.clientY), i >= 0);
    if (dragFrom >= 0 && !dragMoved &&
        Math.hypot(e.clientX - downX, e.clientY - downY) > 8) dragMoved = true;
  });
  host.addEventListener('mouseleave', () => {
    if (wheel) { wheel.setHover(-1); wheel.setNeedle(0, false); }
  });

  host.addEventListener('mousedown', (e) => {
    if (e.target.closest('.slot-picker')) return;
    dragFrom = idxAt(e.clientX, e.clientY);
    dragMoved = false; downX = e.clientX; downY = e.clientY;
    if (dragFrom >= 0 && wheel.sectors[dragFrom]) wheel.sectors[dragFrom].g.classList.add('dragsrc');
  });

  window.addEventListener('mouseup', (e) => {
    if (dragFrom < 0) return;
    const from = dragFrom, moved = dragMoved;
    dragFrom = -1; dragMoved = false;
    if (wheel && wheel.sectors[from]) wheel.sectors[from].g.classList.remove('dragsrc');
    if (!host.contains(e.target) && !moved) return;
    const to = idxAt(e.clientX, e.clientY);
    if (moved) {
      if (to >= 0 && to !== from) {
        const arr = previewColors ? cfg.colors : cfg.tools;
        const [m] = arr.splice(from, 1);
        arr.splice(to, 0, m);
        renderAll();
      }
      return;
    }
    if (to === from && to >= 0) openSlot(to);
  });

  /* ---------------------------------------------- выбор содержимого сектора */
  let slotIdx = -1;

  function openSlot(i) {
    if (previewColors) {                       // в режиме палитры правим сам цвет
      const inp = document.createElement('input');
      inp.type = 'color';
      inp.value = cfg.colors[i] || '#868e96';
      inp.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(inp);
      inp.addEventListener('input', () => { cfg.colors[i] = inp.value.toLowerCase(); renderAll(); });
      inp.addEventListener('change', () => inp.remove());
      inp.click();
      return;
    }
    slotIdx = i;
    $('spTitle').textContent = 'Сектор ' + (i + 1) + ' — что положить';
    fillGrid($('spTools'), TOOL_ORDER);
    fillGrid($('spColors'), cfg.colors.map(E.colorId));
    $('spRemove').disabled = cfg.tools.length <= 2;
    $('slotPicker').hidden = false;
  }

  function fillGrid(box, ids) {
    box.textContent = '';
    ids.forEach((id) => {
      const e = E.entryFor(id);
      if (!e) return;
      const b = document.createElement('button');
      b.className = 'sp-item' + (cfg.tools[slotIdx] === id ? ' cur' : '');
      b.innerHTML = (e.isColor
        ? `<span class="swatch" style="background:${e.color}"></span>`
        : `<svg viewBox="0 0 24 24">${ICONS[e.icon] || ''}</svg>`) + `<span>${e.label}</span>`;
      b.addEventListener('click', () => {
        const at = slotIdx, dup = cfg.tools.indexOf(id);
        if (dup === at) { closeSlot(); return; }
        if (dup >= 0) cfg.tools[dup] = cfg.tools[at];   // уже есть в колесе — меняем местами
        cfg.tools[at] = id;
        closeSlot(); renderAll();
      });
      box.appendChild(b);
    });
  }
  function closeSlot() { $('slotPicker').hidden = true; slotIdx = -1; }
  $('spClose').addEventListener('click', closeSlot);
  $('spRemove').addEventListener('click', () => {
    if (cfg.tools.length > 2 && slotIdx >= 0) cfg.tools.splice(slotIdx, 1);
    closeSlot(); renderAll();
  });
  $('addSlot').addEventListener('click', () => {
    if (previewColors) {
      if (cfg.colors.length < 14) { cfg.colors.push('#868e96'); renderAll(); }
      return;
    }
    if (cfg.tools.length >= 14) return;
    const free = TOOL_ORDER.find((id) => !cfg.tools.includes(id)) || 'freedraw';
    cfg.tools.push(free);
    renderAll();
    openSlot(cfg.tools.length - 1);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('slotPicker').hidden) closeSlot();
  });

  function renderAll() { renderPalette(); renderTools(); renderWheel(); save(); }

  /* -------------------------------------------------------------- фишки */
  function chip(id, mode) {
    const e = E.entryFor(id);
    if (!e) return document.createComment('');
    const d = document.createElement('div');
    d.className = 'chip';
    d.dataset.id = id;
    const idx = cfg.tools.indexOf(id);
    const glyph = e.isColor
      ? `<span class="swatch" style="background:${e.color}"></span>`
      : `<svg viewBox="0 0 24 24">${ICONS[e.icon] || ''}</svg>`;
    d.innerHTML =
      (mode === 'chosen' ? `<span class="num">${idx + 1}</span>` : '') +
      glyph + `<span>${e.label}</span>` +
      (mode === 'chosen' ? '<button class="x" title="Убрать">✕</button>' : '');

    if (mode === 'chosen') {
      d.draggable = true;
      d.querySelector('.x').addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (cfg.tools.length <= 2) return;
        cfg.tools = cfg.tools.filter((x) => x !== id);
        renderTools(); renderWheel(); save();
      });
      d.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', id);
        ev.dataTransfer.effectAllowed = 'move';
        d.classList.add('drag');
      });
      d.addEventListener('dragend', () => d.classList.remove('drag'));
      d.addEventListener('dragover', (ev) => { ev.preventDefault(); d.classList.add('over'); });
      d.addEventListener('dragleave', () => d.classList.remove('over'));
      d.addEventListener('drop', (ev) => {
        ev.preventDefault(); d.classList.remove('over');
        const src = ev.dataTransfer.getData('text/plain');
        if (!src || src === id) return;
        const from = cfg.tools.indexOf(src);
        if (from < 0) return;
        cfg.tools.splice(from, 1);
        cfg.tools.splice(cfg.tools.indexOf(id), 0, src);
        renderTools(); renderWheel(); save();
      });
    } else {
      d.addEventListener('click', () => {
        if (cfg.tools.length >= 14) return;
        cfg.tools = cfg.tools.concat([id]);
        renderTools(); renderWheel(); save();
      });
    }
    return d;
  }

  function renderTools() {
    const chosen = $('chosen'), pool = $('pool');
    chosen.textContent = ''; pool.textContent = '';
    cfg.tools.forEach((id) => chosen.appendChild(chip(id, 'chosen')));
    const available = TOOL_ORDER.concat(cfg.colors.map(E.colorId));
    available.filter((id) => !cfg.tools.includes(id))
      .forEach((id) => pool.appendChild(chip(id, 'pool')));
    $('count').textContent = cfg.tools.length + ' из 14';
  }

  /* ------------------------------------------------------------- палитра */
  function renderPalette() {
    const box = $('palette');
    box.textContent = '';
    cfg.colors.forEach((hex, i) => {
      const d = document.createElement('div');
      d.className = 'sw';
      d.draggable = true;
      d.title = E.colorName(hex);
      d.innerHTML = `<input type="color" value="${hex}"><button class="x" title="Убрать">✕</button>`;
      d.querySelector('input').addEventListener('input', (e) => {
        cfg.colors[i] = e.target.value.toLowerCase();
        renderTools(); renderWheel(); save();
      });
      d.querySelector('.x').addEventListener('click', () => {
        if (cfg.colors.length <= 2) return;
        cfg.colors.splice(i, 1);
        renderPalette(); renderTools(); renderWheel(); save();
      });
      d.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(i));
        d.classList.add('drag');
      });
      d.addEventListener('dragend', () => d.classList.remove('drag'));
      d.addEventListener('dragover', (e) => { e.preventDefault(); d.classList.add('over'); });
      d.addEventListener('dragleave', () => d.classList.remove('over'));
      d.addEventListener('drop', (e) => {
        e.preventDefault(); d.classList.remove('over');
        const from = +e.dataTransfer.getData('text/plain');
        if (Number.isNaN(from) || from === i) return;
        const [m] = cfg.colors.splice(from, 1);
        cfg.colors.splice(i, 0, m);
        renderPalette(); renderTools(); renderWheel(); save();
      });
      box.appendChild(d);
    });
    if (cfg.colors.length < 14) {
      const add = document.createElement('button');
      add.className = 'sw-add';
      add.textContent = '+';
      add.title = 'Добавить цвет';
      add.addEventListener('click', () => {
        cfg.colors.push('#868e96');
        renderPalette(); renderTools(); renderWheel(); save();
      });
      box.appendChild(add);
    }
  }

  /* ------------------------------------------------------ горячая клавиша */
  let recording = false;
  const hk = $('hotkey');
  function paintHotkey() {
    hk.textContent = recording ? 'Нажмите клавишу…' : E.triggerLabel(cfg.trigger);
    hk.classList.toggle('rec', recording);
    $('capsWarn').hidden = !(cfg.trigger.code === 'CapsLock' && IS_MAC);
  }
  hk.addEventListener('click', () => { recording = true; paintHotkey(); });
  window.addEventListener('keydown', (e) => {
    if (!recording) return;
    e.preventDefault(); e.stopPropagation();
    if (e.code === 'Escape') { recording = false; paintHotkey(); return; }
    if (!e.code) return;
    const mod = /^(Shift|Control|Alt|Meta|Caps)/.test(e.code);
    cfg.trigger = {
      code: e.code, key: e.key,
      ctrl: mod ? false : e.ctrlKey, alt: mod ? false : e.altKey,
      shift: mod ? false : e.shiftKey, meta: mod ? false : e.metaKey
    };
    recording = false; paintHotkey(); save();
  }, true);

  /* --------------------------------------------------------------- поля */
  const SLIDERS = [
    ['radius', 'radiusV', (v) => v, (v) => v + ' px'],
    ['innerRatio', 'innerV', (v) => v / 100, (v) => (100 - v) + ' %'],
    ['gapPx', 'gapV', (v) => v, (v) => v + ' px'],
    ['deadzone', 'deadV', (v) => v, (v) => v + ' px'],
    ['animSpeed', 'animV', (v) => v / 10, (v) => (v === 0 ? 'выкл' : '×' + (v / 10).toFixed(1))],
    ['dwellMs', 'dwellV', (v) => v, (v) => (v === 0 ? 'выкл' : v + ' мс')]
  ];
  const rawOf = (key) => key === 'innerRatio' ? Math.round(cfg[key] * 100)
    : key === 'animSpeed' ? Math.round(cfg[key] * 10) : cfg[key];

  function paint() {
    SLIDERS.forEach(([key, out, , fmt]) => {
      const raw = rawOf(key);
      $(key).value = raw;
      $(out).textContent = fmt(raw);
    });
    document.querySelectorAll('input[name=mode]').forEach((r) => { r.checked = r.value === cfg.mode; });
    ['followCursor', 'quickNumbers', 'showKbd'].forEach((k) => { $(k).checked = !!cfg[k]; });
    $('theme').value = cfg.theme;
    $('colorTarget').value = cfg.colorTarget;
    paintHotkey();
  }

  SLIDERS.forEach(([key, out, conv, fmt]) => {
    $(key).addEventListener('input', (e) => {
      const raw = +e.target.value;
      cfg[key] = conv(raw);
      $(out).textContent = fmt(raw);
      renderWheel(); save();
    });
  });
  document.querySelectorAll('input[name=mode]').forEach((r) =>
    r.addEventListener('change', () => { cfg.mode = r.value; save(); }));
  ['followCursor', 'quickNumbers', 'showKbd'].forEach((k) =>
    $(k).addEventListener('change', (e) => { cfg[k] = e.target.checked; renderWheel(); save(); }));
  $('theme').addEventListener('change', (e) => { cfg.theme = e.target.value; renderWheel(); save(); });
  $('colorTarget').addEventListener('change', (e) => { cfg.colorTarget = e.target.value; save(); });
  $('reset').addEventListener('click', () => {
    cfg = JSON.parse(JSON.stringify(DEFAULTS));
    chrome.storage.sync.set(cfg);
    paint(); renderPalette(); renderTools(); renderWheel();
  });

  /* ---------------------------------------------------------------- старт */
  chrome.storage.sync.get(DEFAULTS, (v) => {
    cfg = Object.assign({}, DEFAULTS, v);
    if (!Array.isArray(cfg.tools) || !cfg.tools.length) cfg.tools = DEFAULTS.tools.slice();
    if (!Array.isArray(cfg.colors) || !cfg.colors.length) cfg.colors = DEFAULTS.colors.slice();
    cfg.tools = cfg.tools.filter((id) => TOOLS[id] || E.isColorId(id));
    paint(); renderPalette(); renderTools(); renderWheel();
  });
})();

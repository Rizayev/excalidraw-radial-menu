/* Заглушка chrome.* только для локального стенда (в расширение не входит).
   Язык переключается через ?lang=ru */
(function () {
  window.chrome = window.chrome || {};

  const lang = new URLSearchParams(location.search).get('lang') || 'en';
  let messages = {};
  try {
    const x = new XMLHttpRequest();
    x.open('GET', '../_locales/' + lang + '/messages.json', false);   // dev-only, синхронно
    x.send(null);
    messages = JSON.parse(x.responseText);
  } catch (e) { console.warn('стенд: не загрузил messages.json', e); }

  chrome.i18n = {
    getMessage(key, subs) {
      const m = messages[key] && messages[key].message;
      if (!m) return '';
      const list = subs == null ? [] : (Array.isArray(subs) ? subs : [subs]);
      return m.replace(/\$(\d)/g, (_, i) => list[i - 1] != null ? list[i - 1] : '');
    },
    getUILanguage: () => lang
  };

  const mem = JSON.parse(localStorage.getItem('ermTest') || '{}');
  chrome.storage = {
    sync: {
      get(defs, cb) { cb(Object.assign({}, defs, mem)); },
      set(v, cb) { Object.assign(mem, v); localStorage.setItem('ermTest', JSON.stringify(mem)); cb && cb(); }
    },
    onChanged: { addListener() {} }
  };
  chrome.runtime = {
    openOptionsPage() {},
    getURL: (path) => '../' + path.replace(/^\//, ''),
    lastError: null,
    sendMessage(msg, cb) {
      if (!msg || msg.type !== 'erm-locale') return;
      fetch('../_locales/' + msg.lang + '/messages.json')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => cb && cb(d))
        .catch(() => cb && cb(null));
    },
    onMessage: { addListener() {} }
  };
})();

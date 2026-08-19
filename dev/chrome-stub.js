// Заглушка chrome.* только для локального стенда (в расширение не входит)
window.chrome = window.chrome || {};
const mem = JSON.parse(localStorage.getItem('ermTest') || '{}');
chrome.storage = {
  sync: {
    get(defs, cb) { cb(Object.assign({}, defs, mem)); },
    set(v, cb) { Object.assign(mem, v); localStorage.setItem('ermTest', JSON.stringify(mem)); cb && cb(); }
  },
  onChanged: { addListener() {} }
};
chrome.runtime = { openOptionsPage() {} };

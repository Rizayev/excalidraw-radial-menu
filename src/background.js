chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

/* Content-скрипт не может сам прочитать _locales (это системная папка расширения),
   поэтому словарь для принудительно выбранного языка отдаёт service worker. */
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (!msg || msg.type !== 'erm-locale') return;
  fetch(chrome.runtime.getURL('_locales/' + msg.lang + '/messages.json'))
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => respond(data))
    .catch(() => respond(null));
  return true;      // ответ придёт асинхронно
});

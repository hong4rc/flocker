const rOrigin = /^(?=\/)/;
const rPathName = /^\/ajax\/hovercard\/(?<type>.+).php$/;

let lastElem = null;
window.oncontextmenu = (event) => {
  const existed = event.path.some((elem) => {
    if (!(elem instanceof HTMLAnchorElement)) {
      lastElem = null;
      return false;
    }
    if (elem.tagName === 'A') {
      lastElem = elem;
      return true;
    }
    return false;
  });
  if (!existed) {
    lastElem = null;
  }
};
const objToForm = (obj) => {
  const form = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    form.append(k, v);
  });
  return form;
};

const fbFetch = (...args) => fetch(...args).then(res => res.text())
  .then((text) => JSON.parse(text.replace('for (;;);', '')));

const blockUser = (id) => fbFetch('https://www.facebook.com/ajax/privacy/block_user.php', {
  method: 'POST',
  credentials: 'include',
  body: objToForm({
    uid: id,
    __a: 1,
    fb_dtsg: document.querySelector('[name="fb_dtsg"]').value,
    confirmed: 1,
  }),
});

const blockPage = (id) => fbFetch('https://www.facebook.com/privacy/block_page/', {
  method: 'POST',
  credentials: 'include',
  body: objToForm({
    page_id: id,
    __a: 1,
    fb_dtsg: document.querySelector('[name="fb_dtsg"]').value,
    confirmed: 1,
  }),
});

chrome.runtime.onMessage.addListener((msg, bgr, sendRes) => {
  if (msg.cmd === 'flock') {
    if (!lastElem) {
      return sendRes({
        err: 'No last element',
      });
    }
    const name = lastElem.getAttribute('title') || lastElem.innerText;
    const hover = lastElem.getAttribute('data-hovercard');
    if (!hover) {
      sendRes({
        err: 'No last element',
      });
    }
    const url = new URL(hover.replace(rOrigin, window.location.origin));
    const id = url.searchParams.get('id');
    const matches = rPathName.exec(url.pathname);
    if (!(id && matches && matches.groups)) {
      return sendRes({
        err: `Not id/match in ${url.href}`,
      });
    }
    const { type } = matches.groups;
    switch (type) {
      case 'user':
        blockUser(id).then((res) => {
          sendRes({
            name,
            type,
            _err: res.error,
          });
        });
        break;
      case 'hovercard':
      case 'page':
        blockPage(id).then((res) => {
          sendRes({
            name,
            type,
            _err: res.error,
          });
        });
        break;
      case 'group':
        return sendRes({
          name,
          type,
        });
      default:
        return sendRes({
          err: `I don't handle ${type} now`,
        });
    }
    return true;
  }
  return sendRes({
    err: '`cmd` is not `flock`',
  });
});

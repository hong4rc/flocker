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

const blockUser = (id) => fetch('https://www.facebook.com/ajax/privacy/block_user.php', {
  method: 'POST',
  credentials: 'include',
  body: objToForm({
    uid: id,
    __a: 1,
    fb_dtsg: document.querySelector('[name="fb_dtsg"]').value,
    confirmed: 1,
  }),
});

const blockPage = (id) => fetch('https://www.facebook.com/privacy/block_page/', {
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
      return false;
    }
    const name = lastElem.getAttribute('title') || lastElem.innerText;
    const url = new URL(lastElem.getAttribute('data-hovercard').replace(rOrigin, window.location.origin));
    const id = url.searchParams.get('id');
    const matches = rPathName.exec(url.pathname);
    if (!(id && matches && matches.groups)) {
      console.warn(url.href);
      return false;
    }
    const { type } = matches.groups;
    switch (type) {
      case 'user':
        blockUser(id).then(() => {
          sendRes({
            name,
            type,
          });
        });
        break;
      case 'hovercard':
      case 'page':
        blockPage(id).then(() => {
          sendRes({
            name,
            type,
          });
        });
        break;
      case 'group':
          sendRes({
            name,
            type,
          });
          return false;
      default:
        console.warn(`I don't handle ${type} now`);
        return false;
    }
    return true;
  }
  return false;
});

const rOrigin = /^(?=\/)/;
const fakeOrigin = 'https://facebook.com'

let lastElem = null;
window.oncontextmenu = (event) => {
  for (elem of event.path) {
    if (!(elem instanceof HTMLAnchorElement)) {
      lastElem = null;
      return;
    }
    if (elem.tagName === 'A') {
      lastElem = elem;
      return;
    }
  }
  lastElem = null;
};
const objToForm = (obj) => {
  const form = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
      form.append(k, v);
  });
  return form;
}

chrome.runtime.onMessage.addListener((msg, bgr, sendRes) => {
  if (msg.cmd === 'flock') {
    if (!lastElem) {
      return;
    }
    const name = lastElem.getAttribute('title');
    const url = new URL(lastElem.getAttribute('data-hovercard').replace(rOrigin, window.location.origin));
    const blocked = () => {
      sendRes({name});
    };
    const id = url.searchParams.get('id');
    if (id) {
      fetch('https://www.facebook.com/ajax/privacy/block_user.php', {
        method: 'POST',
        credentials: 'include',
        body: objToForm({
          uid: id,
          __a: 1,
          fb_dtsg: document.querySelector('[name="fb_dtsg"]').value,
          confirmed: 1
        })
      }).then(blocked, console.warn);
      return true;
    }
  }
});

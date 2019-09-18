
const iconBlocked = chrome.extension.getURL('images/bl128.png');
const blockFb = {
  id: 'block',
  title: 'Flock now',
  contexts: ['link'],
  targetUrlPatterns: ['*://*.facebook.com/*'],
};

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create(blockFb);
});

const rFbName = /\/(.+)/;
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const link = new URL(info.linkUrl);
  const m = rFbName.exec(link.pathname);
  if (m && m.length !== 2) {
    return;
  }
  chrome.tabs.sendMessage(tab.id, {
    cmd: 'flock',
  }, (res) => {
    if (!res) {
      return;
    }
    if (res.err) {
      console.info(res.err);
      return;
    }
    if (res.type === 'group') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: iconBlocked,
        title: res.name,
        message: 'Too dangerous',
      });
    } else if (res.name) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: iconBlocked,
        title: res.name,
        message: res._err ? 'Cannot block' : `Blocked ${res.type}`,
      }, (nId) => {
        setTimeout(() => chrome.notifications.clear(nId), 10000);
      });
    }
  });
});

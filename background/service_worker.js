// background/service_worker.js

const YOUTUBE_ORIGIN = 'https://www.youtube.com';

chrome.runtime.onInstalled.addListener(() => {
  // Optional: Perform actions on installation
});

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for tab updates to enable/disable the side panel based on the URL
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  if (url.origin === YOUTUBE_ORIGIN) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'popup/popup.html',
      enabled: true
    });
  } else {
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }
});

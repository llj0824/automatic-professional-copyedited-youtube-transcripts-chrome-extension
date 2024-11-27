// background/service_worker.js
const YOUTUBE_ORIGIN = 'www.youtube.com';

// Configure side panel to open on action click
console.log('Configuring side panel behavior...');
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Helper: Show or hide the side panel
async function togglePanel(tabId, shouldShow) {
  console.log(`Toggling panel for tab ${tabId}, shouldShow: ${shouldShow}`);

  if (shouldShow) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'popup/popup.html',
      enabled: true
    });
    console.log('Panel opened');
    return;
  }

  await chrome.sidePanel.setOptions({
    path: 'popup/popup.html',
    enabled: false
  });
  console.log('Panel closed');
}

// Event: User clicks extension icon - show panel
chrome.action.onClicked.addListener((tab) => {
  togglePanel(tab.id, true);
});

// Event: User switches tabs - hide panel if not on YouTube
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  const isYouTube = tab.url?.includes(YOUTUBE_ORIGIN);
  
  if (!isYouTube) {
    togglePanel(tabId, false);
  }
});

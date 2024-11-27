// background/service_worker.js
const YOUTUBE_ORIGIN = 'https://www.youtube.com';

// Configure side panel to open on action click
console.log('Configuring side panel behavior...');
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Toggle panel open/closed for a specific tab
async function togglePanel(tabId, shouldOpen) {
  const tab = await chrome.tabs.get(tabId);
  console.log('Toggling panel for tab:', tab, 'shouldOpen:', shouldOpen);
  
  if (shouldOpen) {
    console.log('Opening panel for tab:', tabId);
    await chrome.sidePanel.setOptions({
      tabId: tabId,
      path: 'popup/popup.html',
      enabled: true
    });
  } else {
    console.log('Closing panel');
    await chrome.sidePanel.setOptions({
      path: 'popup/popup.html',
      enabled: false
    });
  }
}

// Show alert when trying to OPEN extension, this isn't called on closing extension.
chrome.action.onClicked.addListener(async (tab) => {
  await togglePanel(tab.id, true)
});

// Listen for tab activation changes
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await togglePanel(tabId, false)
});

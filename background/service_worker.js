// background/service_worker.js
const YOUTUBE_ORIGIN = 'https://www.youtube.com';

// Track which tabs have the panel open
const extensionEnabledTabs = new Set();

// Configure side panel to open on action click
console.log('Configuring side panel behavior...');
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Toggle panel open/closed for a specific tab
async function togglePanel(tabId, shouldOpen) {
  console.log('Toggling panel for tab:', tabId, 'shouldOpen:', shouldOpen);
  
  if (shouldOpen) {
    extensionEnabledTabs.add(tabId);
    console.log('Opening panel for tab:', tabId);
    await chrome.sidePanel.setOptions({
      path: 'popup/popup.html',
      enabled: true
    });
  } else {
    console.log('Closing panel');
    await chrome.sidePanel.setOptions({
      enabled: false
    });
  }
}

// Show alert when trying to OPEN extension, this isn't called on closing extension.
chrome.action.onClicked.addListener(async (tab) => {
  console.log('OnClicked tab details:', tab);
  if (!tab.url) return;
  await togglePanel(tab.id, true);
});

// Listen for tab activation changes
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  console.log('OnActivated tab details:', tab);
  if (!extensionEnabledTabs.has(tabId)) {
    await togglePanel(tabId, false);
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log('OnActivated tab details:', tabId);
  extensionEnabledTabs.delete(tabId);
});

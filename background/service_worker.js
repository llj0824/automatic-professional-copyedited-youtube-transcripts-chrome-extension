// background/service_worker.js
console.log('Service worker initialized');

const YOUTUBE_ORIGIN = 'https://www.youtube.com';
console.log('YouTube origin set to:', YOUTUBE_ORIGIN);

// Configure side panel to open on action click
console.log('Configuring side panel behavior...');
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Toggle panel open/closed for a specific tab
async function togglePanel(tabId, shouldOpen) {
  console.log('Toggling panel for tab:', tabId, 'shouldOpen:', shouldOpen);
  
  if (shouldOpen) {
    panelTabs.add(tabId);
    console.log('Opening panel for tab:', tabId);
    await chrome.sidePanel.setOptions({
      tabId,
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

// Track which tabs have the panel open
const panelTabs = new Set();

// Show alert when trying to open extension on non-YouTube sites
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked on tab:', tab);
  if (!tab.url || new URL(tab.url).origin !== YOUTUBE_ORIGIN) {
    console.log('Non-YouTube site detected, showing alert. Tab URL:', tab.url);
    alert('This extension only works on YouTube websites')
    return;
  }

  await togglePanel(tab.id, true);
});

// Listen for tab activation changes
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!panelTabs.has(tabId)) {
    await togglePanel(tabId, false);
  }

  const tab = await chrome.tabs.get(tabId);
  console.log('Retrieved tab details:', tab);
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  panelTabs.delete(tabId);
});

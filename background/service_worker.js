// background/service_worker.js
console.log('Service worker initialized');

const YOUTUBE_ORIGIN = 'https://www.youtube.com';
console.log('YouTube origin set to:', YOUTUBE_ORIGIN);

// Track which tabs have the panel open
const openPanelTabs = new Set();

// Show alert when trying to open extension on non-YouTube sites
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked on tab:', tab);
  if (!tab.url || new URL(tab.url).origin !== YOUTUBE_ORIGIN) {
    console.log('Non-YouTube site detected, showing alert. Tab URL:', tab.url);
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => alert('This extension only works on YouTube websites')
    });
    return;
  }
  
  // Track that this tab has the panel open
  openPanelTabs.add(tab.id);
});

// Configure side panel to open on action click
console.log('Configuring side panel behavior...');
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));
// Listen for tab updates to enable/disable the side panel based on the URL
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  console.log('Tab updated - ID:', tabId, 'Info:', info, 'Tab:', tab);
  debugger;
  if (!tab.url) {
    console.log('No URL found for tab:', tabId);
    return;
  }
  const url = new URL(tab.url);
  console.log('Processing URL:', url.toString());
  if (url.origin === YOUTUBE_ORIGIN) {
    console.log('YouTube site detected, enabling side panel');
    await togglePanel(tabId, true);
  } else {
    console.log('Non-YouTube site detected, disabling side panel');
    await togglePanel(tabId, false);
    openPanelTabs.delete(tabId);
  }
});

// Toggle panel open/closed for a specific tab
async function togglePanel(tabId, shouldOpen) {
  await chrome.sidePanel.setOptions({
    tabId,
    path: 'popup/popup.html',
    enabled: shouldOpen
  });
}

// Listen for tab activation changes
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  console.log('Tab activated:', tabId);
  const tab = await chrome.tabs.get(tabId);
  console.log('Retrieved tab details:', tab);
  if (!tab.url) {
    console.log('No URL found for activated tab:', tabId);
    return;
  }
  
  const url = new URL(tab.url);
  console.log('Processing activated tab URL:', url.toString());
  if (url.origin === YOUTUBE_ORIGIN) {
    console.log('Non-YouTube site detected on tab activation, closing side panel');
    // Only show panel if it was previously opened on this tab
    if (!openPanelTabs.has(tabId)) {
      await togglePanel(tabId, false);
    }
  } else {
    await togglePanel(tabId, false);
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  openPanelTabs.delete(tabId);
});

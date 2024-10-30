// Listen for messages from the popup to send the transcript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTranscript") {
    // Get video ID from current URL
    const videoId = new URL(window.location.href).searchParams.get('v');
    sendResponse({ videoId });
  }
});
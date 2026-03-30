chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "font-details",
    title: "Font Details",
    contexts: ["selection", "all"]
  });

  // Enable side panel on extension icon click
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "font-details") {
    chrome.tabs.sendMessage(tab.id, { action: "GET_FONT_DETAILS" });
  }
});

// SERP Analysis Fetcher
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_SERP_DATA") {
    fetch(request.url)
      .then(response => response.text())
      .then(html => {
        // Simple regex to extract headings since DOMParser isn't in Service Worker
        const headings = [];
        const hRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
        let match;
        while ((match = hRegex.exec(html)) !== null && headings.length < 50) {
          const tag = match[1].toUpperCase();
          const text = match[2].replace(/<[^>]*>/g, '').trim().substring(0, 80);
          if (text) {
            headings.push({ tag, text });
          }
        }
        sendResponse({ success: true, headings });
      })
      .catch(error => {
        console.error("SERP Fetch Error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open
  }
});

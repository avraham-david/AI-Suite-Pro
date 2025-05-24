chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_AI_CHAT_SIDEBAR" }, (response) => {
      if (chrome.runtime.lastError) {
        // console.log("AI Chat: Content script not responding, attempting to inject.");
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }).then(() => {
          chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['styles.css']
          });
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_AI_CHAT_SIDEBAR" }, (r) => {
              if (chrome.runtime.lastError) {
                console.error("AI Chat: Failed to send message even after injection:", chrome.runtime.lastError.message);
              }
            });
          }, 500);
        }).catch(err => console.error("AI Chat: Failed to inject script: ", err));
      }
    });
  }
});
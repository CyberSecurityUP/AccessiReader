console.log("[AccessiReader] Background service worker initialized")

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("[AccessiReader] Extension installed successfully")
  }
})

// All messages from popup (no sender.tab) get forwarded to the active tab's content script
const FORWARDED_MESSAGES = [
  "START_READING",
  "STOP_READING",
  "PAUSE_READING",
  "RESUME_READING",
  "NEXT_BLOCK",
  "PREV_BLOCK",
  "ACTIVATE_SELECTOR",
  "DEACTIVATE_SELECTOR",
  "READ_SELECTION",
  "SETTINGS_UPDATED",
  "GET_STATUS"
]

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Only forward messages from popup (popup has no sender.tab)
  if (!sender.tab && FORWARDED_MESSAGES.includes(request.type)) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (tabId) {
        chrome.tabs.sendMessage(tabId, request, (response) => {
          // Handle chrome.runtime.lastError to avoid unchecked error
          if (chrome.runtime.lastError) {
            console.warn(
              "[AccessiReader] Failed to reach content script:",
              chrome.runtime.lastError.message
            )
            sendResponse({ success: false, error: "Content script not ready" })
            return
          }
          sendResponse(response || { success: false })
        })
      } else {
        sendResponse({ success: false, error: "No active tab" })
      }
    })
    return true // async response
  }

  return false
})

// Keep service worker alive during active reading
chrome.runtime.onConnect.addListener((port) => {
  console.log("[AccessiReader] Port connected:", port.name)
  port.onDisconnect.addListener(() => {
    console.log("[AccessiReader] Port disconnected:", port.name)
  })
})

export {}

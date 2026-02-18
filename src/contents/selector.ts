import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_end",
  all_frames: false
}

// Only handle selector-specific messages, ignore everything else
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "ACTIVATE_SELECTOR") {
    window.dispatchEvent(new CustomEvent("accessireader:activate-selector"))
    sendResponse({ success: true })
    return true
  }
  if (message.type === "DEACTIVATE_SELECTOR") {
    window.dispatchEvent(new CustomEvent("accessireader:deactivate-selector"))
    sendResponse({ success: true })
    return true
  }
  // IMPORTANT: return false for all other messages so they reach other listeners
  return false
})

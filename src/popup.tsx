import { useState, useEffect, useMemo } from "react"
import "~style.css"

interface TabStatus {
  isReading?: boolean
  isPaused?: boolean
  currentIndex?: number
  totalBlocks?: number
  mode?: string
}

function sendToTab(type: string, payload?: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      resolve(response)
    })
  })
}

function getOSModifier(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes("mac")) return "Ctrl"
  return "Alt"
}

function IndexPopup() {
  const [status, setStatus] = useState<TabStatus>({})
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null)
  const mod = useMemo(() => getOSModifier(), [])

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setActiveTab(tabs[0] || null)
    })
  }, [])

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = (await sendToTab("GET_STATUS")) as TabStatus
        if (res) setStatus(res)
      } catch {
        // Tab may not have content script loaded
      }
    }, 1000)
    return () => clearInterval(poll)
  }, [])

  const isRestricted =
    !activeTab?.url ||
    activeTab.url.startsWith("chrome://") ||
    activeTab.url.startsWith("chrome-extension://") ||
    activeTab.url.startsWith("about:")

  return (
    <div className="w-[320px] bg-reader-dark text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-reader-primary flex items-center justify-center text-lg font-bold">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold">AccessiReader</h1>
            <p className="text-[10px] text-white/50">
              Page reader for accessibility
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                status.isReading
                  ? status.isPaused
                    ? "bg-reader-warning"
                    : "bg-reader-success animate-pulse"
                  : "bg-white/30"
              }`}
            />
            <span className="text-[10px] text-white/60">
              {status.isReading
                ? status.isPaused
                  ? "Paused"
                  : "Reading"
                : "Idle"}
            </span>
          </div>
        </div>
      </div>

      {isRestricted ? (
        <div className="p-4 text-center">
          <p className="text-sm text-white/60">
            Cannot read this page.
          </p>
          <p className="text-[10px] text-white/40 mt-1">
            Navigate to a web page to use AccessiReader.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (status.isReading) {
                  sendToTab("STOP_READING")
                } else {
                  sendToTab("START_READING")
                }
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-xs transition-colors ${
                status.isReading
                  ? "bg-reader-error/20 text-reader-error hover:bg-reader-error/30"
                  : "bg-reader-primary text-white hover:bg-reader-primary/80"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                {status.isReading ? (
                  <path d="M6 6h12v12H6z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
              {status.isReading ? "Stop" : "Read Page"}
            </button>

            <button
              onClick={() => sendToTab("ACTIVATE_SELECTOR")}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-xs bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M3 3h6v2H5v4H3V3zm12 0h6v6h-2V5h-4V3zM5 15v4h4v2H3v-6h2zm14 4v-4h2v6h-6v-2h4zM11 7h2v4h4v2h-4v4h-2v-4H7v-2h4V7z" />
              </svg>
              Select Content
            </button>
          </div>

          {/* Playback Controls (when reading) */}
          {status.isReading && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => sendToTab("PREV_BLOCK")}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Previous"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              <button
                onClick={() =>
                  sendToTab(
                    status.isPaused ? "RESUME_READING" : "PAUSE_READING"
                  )
                }
                className="p-2 rounded-lg bg-reader-primary hover:bg-reader-primary/80 transition-colors"
                aria-label={status.isPaused ? "Resume" : "Pause"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  {status.isPaused ? (
                    <path d="M8 5v14l11-7z" />
                  ) : (
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  )}
                </svg>
              </button>

              <button
                onClick={() => sendToTab("NEXT_BLOCK")}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Next"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          )}

          {/* Progress */}
          {status.isReading && status.totalBlocks && (
            <div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-reader-primary rounded-full transition-all"
                  style={{
                    width: `${
                      ((status.currentIndex || 0) + 1) /
                      (status.totalBlocks || 1) *
                      100
                    }%`
                  }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1 text-center">
                Block {(status.currentIndex || 0) + 1} of {status.totalBlocks}
              </p>
            </div>
          )}

          {/* Keyboard Shortcuts Reference */}
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] text-white/40 font-medium mb-1.5">
              Keyboard Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
              {[
                [`${mod}+F`, "Read full page"],
                [`${mod}+R`, "Play/Pause"],
                [`${mod}+S`, "Stop"],
                [`${mod}+C`, "Select content"],
                [`${mod}+\u2190/\u2192`, "Prev/Next block"],
                [`${mod}+\u2191/\u2193`, "Speed up/down"],
                [`${mod}+H`, "Hide overlay"]
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/60 font-mono text-[9px]">
                    {key}
                  </kbd>
                  <span className="text-white/50">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 text-center">
        <p className="text-[9px] text-white/30">
          AccessiReader v1.0.0 - Accessibility for everyone
        </p>
      </div>
    </div>
  )
}

export default IndexPopup

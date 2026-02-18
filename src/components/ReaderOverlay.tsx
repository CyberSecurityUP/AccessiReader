import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useReaderStore, useSettings } from "~store"
import { useReader } from "~hooks/useReader"
import { useContentSelector } from "~hooks/useContentSelector"
import { useKeyboardShortcuts } from "~hooks/useKeyboardShortcuts"
import { ProgressBar } from "./ProgressBar"
import { SpeedControl } from "./SpeedControl"
import { VoiceSelector } from "./VoiceSelector"
import { ContentHighlighter } from "./ContentHighlighter"
import { SettingsPanel } from "./SettingsPanel"
import { getShortcutHints, getModifierLabel } from "~utils/platform"

// Icons as inline SVG for zero dependencies
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M8 5v14l11-7z" />
  </svg>
)
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
)
const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M6 6h12v12H6z" />
  </svg>
)
const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
)
const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
)
const SelectorIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M3 3h6v2H5v4H3V3zm12 0h6v6h-2V5h-4V3zM5 15v4h4v2H3v-6h2zm14 4v-4h2v6h-6v-2h4zM11 7h2v4h4v2h-4v4h-2v-4H7v-2h4V7z" />
  </svg>
)
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z" />
  </svg>
)
const MinimizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
    <path d="M19 13H5v-2h14v2z" />
  </svg>
)
const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
    <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
  </svg>
)

const OVERLAY_WIDTH = 320
const OVERLAY_MIN_HEIGHT = 40

export function ReaderOverlay() {
  const settings = useSettings()
  const isReading = useReaderStore((s) => s.isReading)
  const isPaused = useReaderStore((s) => s.isPaused)
  const currentBlock = useReaderStore((s) => s.currentBlock)
  const progress = useReaderStore((s) => s.progress)
  const mode = useReaderStore((s) => s.mode)
  const overlayVisible = useReaderStore((s) => s.overlayVisible)
  const setOverlayVisible = useReaderStore((s) => s.setOverlayVisible)
  const updateSettings = useReaderStore((s) => s.updateSettings)
  const selectedCount = useReaderStore((s) => s.selectedElements.length)
  const reader = useReader()
  const selector = useContentSelector()

  const handlePlay = useCallback(() => {
    if (!isReading) {
      if (selectedCount > 0) {
        selector.deactivate()
        reader.startSelectorReading()
      } else {
        reader.startFullPageReading()
      }
    } else if (isPaused) {
      reader.resume()
    } else {
      reader.pause()
    }
  }, [isReading, isPaused, selectedCount, reader, selector])

  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState(settings.overlayPosition)
  const dragRef = useRef<{ startX: number; startY: number } | null>(null)

  // Theme classes
  const themeClass = useMemo(() => {
    switch (settings.theme) {
      case "high-contrast":
        return "hc-theme"
      case "light":
        return "light-theme"
      default:
        return "dark-theme"
    }
  }, [settings.theme])

  // Keyboard shortcuts
  useKeyboardShortcuts(
    useMemo(
      () => ({
        onTogglePlayPause: handlePlay,
        onStop: reader.stop,
        onNextBlock: reader.nextBlock,
        onPrevBlock: reader.prevBlock,
        onToggleSelector: () => {
          if (selector.isActive) {
            selector.deactivate()
          } else {
            selector.activate()
          }
        },
        onToggleOverlay: () => setOverlayVisible(!overlayVisible),
        onSpeedUp: () =>
          updateSettings({
            rate: Math.min(3, settings.rate + 0.25)
          }),
        onSlowDown: () =>
          updateSettings({
            rate: Math.max(0.5, settings.rate - 0.25)
          }),
        onReadFullPage: reader.startFullPageReading
      }),
      [handlePlay, reader, selector, overlayVisible, settings.rate, setOverlayVisible, updateSettings]
    )
  )

  // Dragging logic
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".no-drag")) return
      setIsDragging(true)
      dragRef.current = {
        startX: e.clientX - position.x,
        startY: e.clientY - position.y
      }
    },
    [position]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const newX = e.clientX - dragRef.current.startX
      const newY = e.clientY - dragRef.current.startY
      const maxX = window.innerWidth - OVERLAY_WIDTH
      const maxY = window.innerHeight - OVERLAY_MIN_HEIGHT

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      updateSettings({ overlayPosition: position })
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, position, updateSettings])

  if (!overlayVisible) return <ContentHighlighter />

  return (
    <>
      <ContentHighlighter />
      <div
        role="region"
        aria-label="AccessiReader controls"
        className={`reader-overlay ${themeClass}`}
        style={{
          position: "fixed",
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: `${OVERLAY_WIDTH}px`,
          zIndex: 999999,
          userSelect: isDragging ? "none" : "auto"
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Scoped styles */}
        <style>{`
          .reader-overlay {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.4;
          }
          .dark-theme .overlay-body {
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            backdrop-filter: blur(12px);
            color: #fff;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          }
          .light-theme .overlay-body {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 12px;
            backdrop-filter: blur(12px);
            color: #1e293b;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          }
          .light-theme .overlay-body .text-white { color: #1e293b; }
          .light-theme .overlay-body .text-white\\/50 { color: rgba(30,41,59,0.5); }
          .light-theme .overlay-body .text-white\\/60 { color: rgba(30,41,59,0.6); }
          .light-theme .overlay-body .text-white\\/70 { color: rgba(30,41,59,0.7); }
          .light-theme .overlay-body .bg-white\\/10 { background: rgba(0,0,0,0.06); }
          .light-theme .overlay-body .bg-white\\/20 { background: rgba(0,0,0,0.1); }
          .light-theme .overlay-body .border-white\\/10 { border-color: rgba(0,0,0,0.1); }
          .hc-theme .overlay-body {
            background: #000;
            border: 3px solid #fff;
            border-radius: 12px;
            color: #fff;
            box-shadow: 0 0 0 2px #ffff00;
          }
          .hc-theme .overlay-body button:focus {
            outline: 3px solid #ffff00;
            outline-offset: 2px;
          }
          .hc-theme .overlay-body .bg-reader-primary {
            background: #ffff00;
            color: #000;
          }
          .overlay-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            cursor: grab;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .overlay-header:active { cursor: grabbing; }
          .ctrl-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: all 0.15s;
          }
          .dark-theme .ctrl-btn {
            background: rgba(255,255,255,0.1);
            color: #fff;
          }
          .dark-theme .ctrl-btn:hover { background: rgba(255,255,255,0.2); }
          .light-theme .ctrl-btn {
            background: rgba(0,0,0,0.06);
            color: #1e293b;
          }
          .light-theme .ctrl-btn:hover { background: rgba(0,0,0,0.1); }
          .hc-theme .ctrl-btn {
            background: #fff;
            color: #000;
            border: 2px solid #ffff00;
          }
          .ctrl-btn-primary {
            width: 40px;
            height: 40px;
          }
          .dark-theme .ctrl-btn-primary {
            background: #2563eb;
            color: #fff;
          }
          .dark-theme .ctrl-btn-primary:hover { background: #1d4ed8; }
          .light-theme .ctrl-btn-primary {
            background: #2563eb;
            color: #fff;
          }
          .hc-theme .ctrl-btn-primary {
            background: #ffff00;
            color: #000;
            border: 2px solid #fff;
          }
          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: inline-block;
          }
          .status-dot.active {
            background: #16a34a;
            animation: pulse-dot 2s ease-in-out infinite;
          }
          .status-dot.paused { background: #d97706; }
          .status-dot.idle { background: rgba(255,255,255,0.3); }
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .block-preview {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }
          .selector-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 600;
          }
          .dark-theme .selector-badge { background: rgba(37, 99, 235, 0.2); color: #93c5fd; }
          .light-theme .selector-badge { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
          .hc-theme .selector-badge { background: #ffff00; color: #000; }
        `}</style>

        <div className="overlay-body">
          {/* Header */}
          <div className="overlay-header">
            <div className="flex items-center gap-2">
              <span
                className={`status-dot ${isReading ? (isPaused ? "paused" : "active") : "idle"}`}
              />
              <span className="text-xs font-semibold">AccessiReader</span>
              {mode !== "idle" && (
                <span className="text-[9px] text-white/50 uppercase">
                  {mode === "full-page" ? "Full Page" : "Selection"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="no-drag ctrl-btn !w-6 !h-6"
                aria-label="Toggle settings"
                aria-expanded={showSettings}
                title="Settings"
              >
                <SettingsIcon />
              </button>
              <button
                onClick={() =>
                  updateSettings({
                    overlayMinimized: !settings.overlayMinimized
                  })
                }
                className="no-drag ctrl-btn !w-6 !h-6"
                aria-label={
                  settings.overlayMinimized ? "Expand overlay" : "Minimize overlay"
                }
                title={settings.overlayMinimized ? "Expand" : "Minimize"}
              >
                {settings.overlayMinimized ? <ExpandIcon /> : <MinimizeIcon />}
              </button>
            </div>
          </div>

          {!settings.overlayMinimized && (
            <div className="p-3 space-y-3">
              {/* Current block preview */}
              {currentBlock && (
                <div className="px-2 py-1.5 rounded-lg bg-white/5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] text-reader-primary font-semibold uppercase">
                      {currentBlock.type}
                      {currentBlock.level ? ` ${currentBlock.level}` : ""}
                    </span>
                  </div>
                  <p className="block-preview text-[11px] text-white/80">
                    {currentBlock.text.substring(0, 120)}
                    {currentBlock.text.length > 120 ? "..." : ""}
                  </p>
                </div>
              )}

              {/* Progress */}
              {isReading && <ProgressBar />}

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={reader.prevBlock}
                  disabled={!isReading}
                  className="no-drag ctrl-btn"
                  aria-label={`Previous block (${getModifierLabel()}+Left)`}
                  title="Previous block"
                >
                  <PrevIcon />
                </button>

                <button
                  onClick={handlePlay}
                  className="no-drag ctrl-btn ctrl-btn-primary"
                  aria-label={
                    !isReading
                      ? selectedCount > 0
                        ? `Read selection (${getModifierLabel()}+R)`
                        : `Start reading (${getModifierLabel()}+F)`
                      : isPaused
                        ? `Resume (${getModifierLabel()}+R)`
                        : `Pause (${getModifierLabel()}+R)`
                  }
                  title={!isReading ? (selectedCount > 0 ? "Read Selection" : "Read Page") : isPaused ? "Resume" : "Pause"}
                >
                  {!isReading || isPaused ? <PlayIcon /> : <PauseIcon />}
                </button>

                <button
                  onClick={reader.stop}
                  disabled={!isReading}
                  className="no-drag ctrl-btn"
                  aria-label={`Stop reading (${getModifierLabel()}+S)`}
                  title="Stop"
                >
                  <StopIcon />
                </button>

                <button
                  onClick={reader.nextBlock}
                  disabled={!isReading}
                  className="no-drag ctrl-btn"
                  aria-label={`Next block (${getModifierLabel()}+Right)`}
                  title="Next block"
                >
                  <NextIcon />
                </button>
              </div>

              {/* Selector Mode */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selector.isActive) {
                        selector.deactivate()
                      } else {
                        selector.activate()
                      }
                    }}
                    className={`no-drag flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      selector.isActive
                        ? "bg-reader-primary text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                    aria-label={`Toggle content selector (${getModifierLabel()}+C)`}
                    aria-pressed={selector.isActive}
                  >
                    <SelectorIcon />
                    {selector.isActive ? "Selecting..." : "Select Content"}
                  </button>

                  {selectedCount > 0 && (
                    <span className="selector-badge">
                      {selectedCount} selected
                    </span>
                  )}
                </div>

                {selectedCount > 0 && !isReading && (
                  <button
                    onClick={() => {
                      selector.deactivate()
                      reader.startSelectorReading()
                    }}
                    className="no-drag w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-semibold bg-reader-primary text-white hover:bg-reader-primary/80 transition-colors"
                    aria-label="Read selected content"
                  >
                    <PlayIcon />
                    Read Selection ({selectedCount})
                  </button>
                )}
              </div>

              {/* Speed & Voice */}
              <SpeedControl />
              <VoiceSelector />

              {/* Settings Panel (collapsible) */}
              {showSettings && (
                <div className="border-t border-white/10 pt-3">
                  <SettingsPanel />
                </div>
              )}

              {/* Keyboard hints - OS-aware */}
              <div className="text-[9px] text-white/30 text-center">
                {getShortcutHints()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isReading && currentBlock
          ? `Reading block ${progress.currentIndex + 1} of ${progress.totalBlocks}: ${currentBlock.type}`
          : ""}
      </div>
    </>
  )
}

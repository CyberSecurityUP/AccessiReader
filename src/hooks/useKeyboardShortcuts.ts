import { useEffect } from "react"
import { isModifierPressed } from "~utils/platform"

export interface ReaderShortcutHandlers {
  onTogglePlayPause?: () => void
  onStop?: () => void
  onNextBlock?: () => void
  onPrevBlock?: () => void
  onToggleSelector?: () => void
  onToggleOverlay?: () => void
  onSpeedUp?: () => void
  onSlowDown?: () => void
  onReadFullPage?: () => void
}

export function useKeyboardShortcuts(handlers: ReaderShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check OS-specific modifier: Ctrl on Mac, Alt on Win/Linux
      if (!isModifierPressed(event)) return

      // Don't intercept if inside inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return
      }

      switch (event.key.toLowerCase()) {
        case "r":
          event.preventDefault()
          handlers.onTogglePlayPause?.()
          break
        case "s":
          event.preventDefault()
          handlers.onStop?.()
          break
        case "f":
          event.preventDefault()
          handlers.onReadFullPage?.()
          break
        case "c":
          event.preventDefault()
          handlers.onToggleSelector?.()
          break
        case "h":
          event.preventDefault()
          handlers.onToggleOverlay?.()
          break
        case "arrowright":
          event.preventDefault()
          handlers.onNextBlock?.()
          break
        case "arrowleft":
          event.preventDefault()
          handlers.onPrevBlock?.()
          break
        case "arrowup":
          event.preventDefault()
          handlers.onSpeedUp?.()
          break
        case "arrowdown":
          event.preventDefault()
          handlers.onSlowDown?.()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [handlers])
}

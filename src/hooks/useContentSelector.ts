import { useEffect, useCallback, useRef } from "react"
import { useReaderStore } from "~store"
import { ContentExtractor } from "~services/content-extractor"

export function useContentSelector() {
  const {
    selectorActive,
    setSelectorActive,
    addSelectedElement,
    clearSelectedElements,
    selectedElements
  } = useReaderStore()

  const extractorRef = useRef(new ContentExtractor())
  const highlightRef = useRef<HTMLElement | null>(null)

  const createHighlight = useCallback(() => {
    if (highlightRef.current) return
    const el = document.createElement("div")
    el.id = "accessireader-selector-highlight"
    el.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 3px solid #2563eb;
      background: rgba(37, 99, 235, 0.1);
      border-radius: 4px;
      z-index: 999998;
      transition: all 0.15s ease;
      display: none;
    `
    document.body.appendChild(el)
    highlightRef.current = el
  }, [])

  const removeHighlight = useCallback(() => {
    highlightRef.current?.remove()
    highlightRef.current = null
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("#plasmo-shadow-container")) return
    if (target.closest("#accessireader-selector-highlight")) return
    if (!highlightRef.current) return

    const rect = target.getBoundingClientRect()
    highlightRef.current.style.top = `${rect.top + window.scrollY}px`
    highlightRef.current.style.left = `${rect.left + window.scrollX}px`
    highlightRef.current.style.width = `${rect.width}px`
    highlightRef.current.style.height = `${rect.height}px`
    highlightRef.current.style.display = "block"
  }, [])

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement
      if (target.closest("#plasmo-shadow-container")) return

      const block = extractorRef.current.extractElement(target)
      if (block) {
        addSelectedElement(block)
        // Visual feedback: flash green
        if (highlightRef.current) {
          highlightRef.current.style.borderColor = "#16a34a"
          highlightRef.current.style.background = "rgba(22, 163, 74, 0.15)"
          setTimeout(() => {
            if (highlightRef.current) {
              highlightRef.current.style.borderColor = "#2563eb"
              highlightRef.current.style.background =
                "rgba(37, 99, 235, 0.1)"
            }
          }, 300)
        }
      }
    },
    [addSelectedElement]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectorActive(false)
      }
    },
    [setSelectorActive]
  )

  useEffect(() => {
    if (selectorActive) {
      createHighlight()
      document.body.style.cursor = "crosshair"
      document.addEventListener("mousemove", handleMouseMove, true)
      document.addEventListener("click", handleClick, true)
      document.addEventListener("keydown", handleKeyDown, true)
    } else {
      removeHighlight()
      document.body.style.cursor = ""
      document.removeEventListener("mousemove", handleMouseMove, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }

    return () => {
      removeHighlight()
      document.body.style.cursor = ""
      document.removeEventListener("mousemove", handleMouseMove, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [
    selectorActive,
    createHighlight,
    removeHighlight,
    handleMouseMove,
    handleClick,
    handleKeyDown
  ])

  // Listen for popup messages
  useEffect(() => {
    const listener = (message: { type: string }) => {
      if (message.type === "ACTIVATE_SELECTOR") {
        clearSelectedElements()
        setSelectorActive(true)
      }
      if (message.type === "DEACTIVATE_SELECTOR") {
        setSelectorActive(false)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [clearSelectedElements, setSelectorActive])

  return {
    activate: () => {
      clearSelectedElements()
      setSelectorActive(true)
    },
    deactivate: () => setSelectorActive(false),
    selectedCount: selectedElements.length,
    isActive: selectorActive
  }
}

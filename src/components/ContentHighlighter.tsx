import { useEffect, useRef } from "react"
import { useReaderStore } from "~store"

export function ContentHighlighter() {
  const currentBlock = useReaderStore((s) => s.currentBlock)
  const highlightCurrent = useReaderStore((s) => s.settings.highlightCurrent)
  const highlightRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!highlightCurrent) {
      highlightRef.current?.remove()
      highlightRef.current = null
      return
    }

    if (!currentBlock) {
      if (highlightRef.current) {
        highlightRef.current.style.display = "none"
      }
      return
    }

    // Create highlight element if needed (in page DOM, not shadow DOM)
    if (!highlightRef.current) {
      const el = document.createElement("div")
      el.id = "accessireader-reading-highlight"
      el.setAttribute("aria-hidden", "true")
      el.style.cssText = `
        position: absolute;
        pointer-events: none;
        border: 2px solid #2563eb;
        background: rgba(37, 99, 235, 0.08);
        border-radius: 4px;
        z-index: 999997;
        transition: all 0.3s ease;
        box-shadow: 0 0 12px rgba(37, 99, 235, 0.2);
      `
      document.body.appendChild(el)
      highlightRef.current = el
    }

    // Find and position highlight
    const selector = currentBlock.elementSelector
    try {
      const target = document.querySelector(selector)
      if (target) {
        const rect = target.getBoundingClientRect()
        const highlight = highlightRef.current
        highlight.style.top = `${rect.top + window.scrollY - 4}px`
        highlight.style.left = `${rect.left + window.scrollX - 4}px`
        highlight.style.width = `${rect.width + 8}px`
        highlight.style.height = `${rect.height + 8}px`
        highlight.style.display = "block"
      }
    } catch {
      // Invalid selector
    }

    // Update position on scroll
    const updatePosition = () => {
      if (!highlightRef.current) return
      try {
        const target = document.querySelector(selector)
        if (target) {
          const rect = target.getBoundingClientRect()
          highlightRef.current.style.top = `${rect.top + window.scrollY - 4}px`
          highlightRef.current.style.left = `${rect.left + window.scrollX - 4}px`
        }
      } catch {
        // Skip
      }
      rafRef.current = requestAnimationFrame(updatePosition)
    }

    rafRef.current = requestAnimationFrame(updatePosition)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [currentBlock, highlightCurrent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      highlightRef.current?.remove()
      highlightRef.current = null
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return null // This component renders directly to the page DOM
}

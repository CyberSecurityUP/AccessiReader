let liveRegion: HTMLElement | null = null

export function announceToScreenReader(message: string): void {
  if (!liveRegion) {
    liveRegion = document.createElement("div")
    liveRegion.setAttribute("role", "status")
    liveRegion.setAttribute("aria-live", "polite")
    liveRegion.setAttribute("aria-atomic", "true")
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(liveRegion)
  }

  // Clear and re-set to trigger announcement
  liveRegion.textContent = ""
  requestAnimationFrame(() => {
    if (liveRegion) liveRegion.textContent = message
  })
}

export function trapFocus(container: HTMLElement): () => void {
  const focusable = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  container.addEventListener("keydown", handler)
  first?.focus()

  return () => container.removeEventListener("keydown", handler)
}

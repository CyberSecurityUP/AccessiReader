export type OSType = "mac" | "windows" | "linux"

let detectedOS: OSType | null = null

export function getOS(): OSType {
  if (detectedOS) return detectedOS

  const ua = navigator.userAgent.toLowerCase()
  const platform = navigator.platform?.toLowerCase() || ""

  if (platform.includes("mac") || ua.includes("macintosh")) {
    detectedOS = "mac"
  } else if (ua.includes("linux")) {
    detectedOS = "linux"
  } else {
    detectedOS = "windows"
  }

  return detectedOS
}

export function isMac(): boolean {
  return getOS() === "mac"
}

/** Returns the modifier key name for display */
export function getModifierLabel(): string {
  return isMac() ? "Ctrl" : "Alt"
}

/** Returns the modifier symbol for compact display */
export function getModifierSymbol(): string {
  return isMac() ? "\u2303" : "Alt"
}

/** Check if the correct modifier is pressed for this OS */
export function isModifierPressed(event: KeyboardEvent): boolean {
  // Mac: use Ctrl (Option/Alt generates special chars)
  // Windows/Linux: use Alt
  return isMac() ? event.ctrlKey && !event.metaKey : event.altKey
}

/** Get full shortcut label for an action */
export function getShortcutLabel(action: string): string {
  const mod = getModifierLabel()
  const labels: Record<string, string> = {
    togglePlayPause: `${mod}+R`,
    stop: `${mod}+S`,
    nextBlock: `${mod}+\u2192`,
    prevBlock: `${mod}+\u2190`,
    toggleSelector: `${mod}+C`,
    toggleOverlay: `${mod}+H`,
    speedUp: `${mod}+\u2191`,
    slowDown: `${mod}+\u2193`,
    readFullPage: `${mod}+F`
  }
  return labels[action] || ""
}

/** Get all shortcuts as array for display */
export function getShortcutList(): Array<[string, string]> {
  const mod = getModifierLabel()
  return [
    [`${mod}+F`, "Read full page"],
    [`${mod}+R`, "Play/Pause"],
    [`${mod}+S`, "Stop"],
    [`${mod}+C`, "Select content"],
    [`${mod}+\u2190/\u2192`, "Prev/Next block"],
    [`${mod}+\u2191/\u2193`, "Speed up/down"],
    [`${mod}+H`, "Hide overlay"]
  ]
}

/** Get compact hints string */
export function getShortcutHints(): string {
  const mod = getModifierLabel()
  return `${mod}+F Read | ${mod}+R Pause | ${mod}+S Stop | ${mod}+C Select | ${mod}+H Hide`
}

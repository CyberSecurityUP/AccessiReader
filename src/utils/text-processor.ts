export function cleanText(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/\s+/g, " ") // collapse whitespace
    .replace(/\n{3,}/g, "\n\n") // max 2 newlines
    .trim()
}

export function truncateForTTS(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const truncated = text.substring(0, maxLength)
  const lastSentence = truncated.lastIndexOf(".")
  if (lastSentence > maxLength * 0.5) {
    return truncated.substring(0, lastSentence + 1)
  }
  return truncated + "..."
}

export function formatCodeForReading(code: string, language?: string): string {
  const lines = code.split("\n").filter((l) => l.trim().length > 0)
  if (lines.length === 0) return ""

  const prefix = language ? `Code block in ${language}.` : "Code block."
  if (lines.length <= 3) {
    return `${prefix} ${lines.join(". ")}`
  }

  // For long code, read first and last lines with summary
  const summary = `${prefix} ${lines.length} lines. Starting with: ${lines[0].trim()}. Ending with: ${lines[lines.length - 1].trim()}.`
  return summary
}

export function formatListForReading(items: string[]): string {
  if (items.length === 0) return ""
  return items
    .map((item, i) => `Item ${i + 1} of ${items.length}: ${item}`)
    .join(". ")
}

export function formatHeadingForReading(
  text: string,
  level: number
): string {
  return `Heading level ${level}. ${text}`
}

export function formatLinkForReading(text: string, href?: string): string {
  if (!href) return text
  const domain = extractDomain(href)
  return domain ? `${text}, link to ${domain}` : text
}

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return null
  }
}

export function formatImageForReading(altText?: string): string {
  if (!altText) return "Image without description"
  return `Image: ${altText}`
}

export function formatTableForReading(el: HTMLElement): string {
  const rows = el.querySelectorAll("tr")
  if (rows.length === 0) return "Empty table"

  const headerCells = rows[0].querySelectorAll("th, td")
  const headers = Array.from(headerCells).map(
    (c) => (c as HTMLElement).innerText.trim()
  )

  const summary = `Table with ${rows.length} rows and ${headers.length} columns.`
  if (headers.length > 0 && headers.some((h) => h.length > 0)) {
    return `${summary} Columns: ${headers.join(", ")}.`
  }
  return summary
}

export function splitIntoSentences(text: string): string[] {
  const raw = text.match(/[^.!?]+[.!?]+\s*/g)
  if (!raw) return [text]
  return raw.map((s) => s.trim()).filter((s) => s.length > 0)
}

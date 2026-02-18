const AD_PATTERNS = [
  /\bad[s]?\b/i,
  /\bsponsor/i,
  /\bpromo/i,
  /\bbanner-ad/i,
  /\badsense/i,
  /\bdoubleclick/i,
  /\bgoogl[e]?ad/i,
  /\baffiliate/i,
  /\bpartner-content/i,
  /\bpaid-content/i,
  /\bnative-ad/i,
  /\bad-slot/i,
  /\bad-wrapper/i,
  /\bad-container/i
]

const CODE_SELECTORS = [
  "pre",
  "code",
  ".highlight",
  ".syntax",
  ".codehilite",
  ".prism",
  ".hljs",
  ".CodeMirror",
  ".monaco-editor",
  '[class*="code-block"]',
  '[class*="codeblock"]',
  '[class*="sourceCode"]'
]

const NAV_SELECTORS = [
  "nav",
  "header",
  "footer",
  "aside",
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  ".sidebar",
  ".menu",
  ".breadcrumb",
  ".pagination",
  ".toc",
  ".table-of-contents"
]

const MAIN_CONTENT_SELECTORS = [
  "article",
  "main",
  '[role="main"]',
  ".post-content",
  ".entry-content",
  ".article-body",
  ".post-body",
  ".story-body",
  "#content",
  ".content",
  ".markdown-body",
  ".prose"
]

export function matchesAdPattern(el: HTMLElement): boolean {
  const idAndClass = `${el.id} ${el.className}`
  if (typeof idAndClass !== "string") return false
  return AD_PATTERNS.some((pattern) => pattern.test(idAndClass))
}

export function isCodeElement(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase()
  if (tag === "pre" || tag === "code") return true
  return CODE_SELECTORS.some((sel) => {
    try {
      return el.matches(sel)
    } catch {
      return false
    }
  })
}

export function isNavElement(el: HTMLElement): boolean {
  const tag = el.tagName.toLowerCase()
  if (["nav", "header", "footer", "aside"].includes(tag)) return true
  return NAV_SELECTORS.some((sel) => {
    try {
      return el.matches(sel)
    } catch {
      return false
    }
  })
}

export function isMainContent(el: HTMLElement): boolean {
  return MAIN_CONTENT_SELECTORS.some((sel) => {
    try {
      return el.matches(sel)
    } catch {
      return false
    }
  })
}

export function isVisibleElement(el: HTMLElement): boolean {
  if (el.offsetParent === null && el.tagName.toLowerCase() !== "body") {
    return false
  }
  const style = window.getComputedStyle(el)
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    el.getAttribute("aria-hidden") !== "true"
  )
}

export function getTextDensity(el: HTMLElement): number {
  const text = el.innerText || ""
  const html = el.innerHTML || ""
  if (html.length === 0) return 0
  return text.length / html.length
}

export function detectCodeLanguage(el: HTMLElement): string | undefined {
  const classes = el.className || ""
  const match = classes.match(
    /(?:language-|lang-|highlight-)(\w+)/i
  )
  if (match) return match[1]

  const parent = el.parentElement
  if (parent) {
    const parentMatch = (parent.className || "").match(
      /(?:language-|lang-|highlight-)(\w+)/i
    )
    if (parentMatch) return parentMatch[1]
  }

  return undefined
}

export function findMainContainer(doc: Document): HTMLElement {
  for (const selector of MAIN_CONTENT_SELECTORS) {
    const el = doc.querySelector<HTMLElement>(selector)
    if (el) return el
  }

  // Fallback: find div with highest text density
  const divs = Array.from(doc.querySelectorAll<HTMLElement>("div"))
  let best: HTMLElement = doc.body
  let bestScore = 0

  for (const div of divs) {
    const text = div.innerText || ""
    if (text.length < 100) continue
    const density = getTextDensity(div)
    const score = density * text.length
    if (score > bestScore) {
      bestScore = score
      best = div
    }
  }

  return best
}

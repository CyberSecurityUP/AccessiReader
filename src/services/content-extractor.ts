import type {
  ContentBlock,
  ContentBlockType,
  AccessiReaderSettings
} from "~types"
import {
  matchesAdPattern,
  isCodeElement,
  isNavElement,
  isMainContent,
  isVisibleElement,
  detectCodeLanguage,
  findMainContainer
} from "~utils/dom-classifier"
import {
  cleanText,
  formatCodeForReading,
  formatImageForReading,
  formatTableForReading,
  truncateForTTS
} from "~utils/text-processor"

const BLOCK_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "pre",
  "blockquote",
  "li",
  "td",
  "th",
  "figcaption",
  "dt",
  "dd"
])

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"])

const SKIP_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "template",
  "audio",
  "video",
  "canvas"
])

export class ContentExtractor {
  private blockIndex = 0

  extractAll(doc: Document): ContentBlock[] {
    this.blockIndex = 0
    const blocks: ContentBlock[] = []
    const mainContainer = findMainContainer(doc)
    this.walkDOM(mainContainer, blocks)
    return blocks
  }

  extractElement(element: HTMLElement): ContentBlock | null {
    if (!isVisibleElement(element)) return null
    const text = cleanText(element.innerText || "")
    if (!text) return null

    const type = this.classifyElement(element)
    const block: ContentBlock = {
      id: this.generateId(element),
      type,
      text: this.getTextForType(element, type, text),
      elementSelector: this.generateSelector(element),
      priority: this.assignPriority(type, element),
      metadata: {
        tagName: element.tagName.toLowerCase(),
        role: element.getAttribute("role") || undefined,
        ariaLabel: element.getAttribute("aria-label") || undefined
      }
    }

    if (HEADING_TAGS.has(element.tagName.toLowerCase())) {
      block.level = parseInt(element.tagName[1])
    }

    if (type === "code") {
      block.language = detectCodeLanguage(element)
    }

    return block
  }

  getReadingOrder(blocks: ContentBlock[]): ContentBlock[] {
    return [...blocks].sort((a, b) => b.priority - a.priority || 0)
  }

  filterBySettings(
    blocks: ContentBlock[],
    settings: AccessiReaderSettings
  ): ContentBlock[] {
    return blocks.filter((block) => {
      if (block.type === "ad" && settings.skipAds) return false
      if (block.type === "nav" && settings.skipNav) return false
      if (block.type === "code" && settings.skipCode) return false
      if (
        block.type === "image-alt" &&
        !settings.contentFilter.includeImages
      )
        return false
      if (block.type === "table" && !settings.contentFilter.includeTables)
        return false
      if (
        block.type === "blockquote" &&
        !settings.contentFilter.includeBlockquotes
      )
        return false
      if (
        block.type === "code" &&
        block.text.length > settings.contentFilter.maxCodeBlockLength
      )
        return false
      return true
    })
  }

  private walkDOM(root: HTMLElement, blocks: ContentBlock[]): void {
    if (!root || !isVisibleElement(root)) return

    const tag = root.tagName.toLowerCase()

    if (SKIP_TAGS.has(tag)) return
    if (matchesAdPattern(root)) {
      // Mark as ad but don't recurse into children
      const adText = cleanText(root.innerText || "")
      if (adText) {
        blocks.push({
          id: this.generateId(root),
          type: "ad",
          text: adText,
          elementSelector: this.generateSelector(root),
          priority: 0,
          metadata: { tagName: tag }
        })
      }
      return
    }

    if (isNavElement(root) && !isMainContent(root)) {
      const navText = cleanText(root.innerText || "")
      if (navText) {
        blocks.push({
          id: this.generateId(root),
          type: "nav",
          text: navText,
          elementSelector: this.generateSelector(root),
          priority: 1,
          metadata: { tagName: tag }
        })
      }
      return
    }

    // Handle images
    if (tag === "img") {
      const alt = (root as HTMLImageElement).alt
      if (alt) {
        blocks.push({
          id: this.generateId(root),
          type: "image-alt",
          text: formatImageForReading(alt),
          elementSelector: this.generateSelector(root),
          priority: 2,
          metadata: { tagName: tag, altText: alt }
        })
      }
      return
    }

    // Handle tables
    if (tag === "table") {
      blocks.push({
        id: this.generateId(root),
        type: "table",
        text: formatTableForReading(root),
        elementSelector: this.generateSelector(root),
        priority: 2,
        metadata: { tagName: tag }
      })
      return
    }

    // Handle block-level elements
    if (BLOCK_TAGS.has(tag)) {
      const type = this.classifyElement(root)
      const rawText = cleanText(root.innerText || "")
      if (!rawText) return

      const block: ContentBlock = {
        id: this.generateId(root),
        type,
        text: this.getTextForType(root, type, rawText),
        elementSelector: this.generateSelector(root),
        priority: this.assignPriority(type, root),
        metadata: {
          tagName: tag,
          role: root.getAttribute("role") || undefined,
          ariaLabel: root.getAttribute("aria-label") || undefined
        }
      }

      if (HEADING_TAGS.has(tag)) {
        block.level = parseInt(tag[1])
      }
      if (type === "code") {
        block.language = detectCodeLanguage(root)
      }

      // Links inside this block
      const link = root.querySelector("a[href]") as HTMLAnchorElement | null
      if (link && block.metadata) {
        block.metadata.href = link.href
      }

      blocks.push(block)
      return
    }

    // Recurse into children
    const children = root.children
    for (let i = 0; i < children.length; i++) {
      this.walkDOM(children[i] as HTMLElement, blocks)
    }
  }

  private classifyElement(el: HTMLElement): ContentBlockType {
    const tag = el.tagName.toLowerCase()

    if (matchesAdPattern(el)) return "ad"
    if (HEADING_TAGS.has(tag)) return "heading"
    if (tag === "pre" || isCodeElement(el)) return "code"
    if (tag === "blockquote") return "blockquote"
    if (tag === "li") return "list-item"
    if (tag === "ul" || tag === "ol") return "list"
    if (tag === "a") return "link"
    if (tag === "img") return "image-alt"
    if (tag === "table") return "table"
    if (isNavElement(el)) return "nav"

    return "paragraph"
  }

  private getTextForType(
    el: HTMLElement,
    type: ContentBlockType,
    rawText: string
  ): string {
    switch (type) {
      case "code":
        return formatCodeForReading(
          el.innerText || rawText,
          detectCodeLanguage(el)
        )
      case "image-alt":
        return formatImageForReading((el as HTMLImageElement).alt)
      case "table":
        return formatTableForReading(el)
      default:
        return rawText
    }
  }

  private assignPriority(
    type: ContentBlockType,
    el: HTMLElement
  ): number {
    if (type === "ad") return 0
    if (type === "nav") return 1
    if (isMainContent(el) || el.closest("article, main, [role='main']")) {
      return 3
    }
    return 2
  }

  private generateId(el: HTMLElement): string {
    this.blockIndex++
    const tag = el.tagName.toLowerCase()
    return `block-${this.blockIndex}-${tag}-${Date.now().toString(36)}`
  }

  private generateSelector(el: HTMLElement): string {
    if (el.id) return `#${CSS.escape(el.id)}`

    const path: string[] = []
    let current: HTMLElement | null = el

    while (current && current !== document.body) {
      if (current.id) {
        path.unshift(`#${CSS.escape(current.id)}`)
        break
      }

      const parent = current.parentElement
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (c) => c.tagName === current!.tagName
        )
        const index = siblings.indexOf(current) + 1
        path.unshift(
          `${current.tagName.toLowerCase()}:nth-of-type(${index})`
        )
      } else {
        path.unshift(current.tagName.toLowerCase())
      }

      current = parent
    }

    return path.join(" > ") || "body"
  }
}

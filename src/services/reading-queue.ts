import type { ContentBlock, ContentBlockType } from "~types"

const TYPE_ANNOUNCEMENTS: Partial<Record<ContentBlockType, string>> = {
  heading: "Heading",
  code: "Code block",
  blockquote: "Block quote",
  list: "List",
  "list-item": "List item",
  "image-alt": "Image",
  table: "Table"
}

export class ReadingQueue {
  private blocks: ContentBlock[] = []
  private _currentIndex = -1

  get currentIndex(): number {
    return this._currentIndex
  }

  get length(): number {
    return this.blocks.length
  }

  get current(): ContentBlock | null {
    if (this._currentIndex >= 0 && this._currentIndex < this.blocks.length) {
      return this.blocks[this._currentIndex]
    }
    return null
  }

  get progress(): number {
    if (this.blocks.length === 0) return 0
    return ((this._currentIndex + 1) / this.blocks.length) * 100
  }

  get hasNext(): boolean {
    return this._currentIndex < this.blocks.length - 1
  }

  get hasPrevious(): boolean {
    return this._currentIndex > 0
  }

  enqueue(blocks: ContentBlock[]): void {
    this.blocks = [...this.blocks, ...blocks]
  }

  replace(blocks: ContentBlock[]): void {
    this.blocks = blocks
    this._currentIndex = -1
  }

  next(): ContentBlock | null {
    if (this._currentIndex < this.blocks.length - 1) {
      this._currentIndex++
      return this.blocks[this._currentIndex]
    }
    return null
  }

  previous(): ContentBlock | null {
    if (this._currentIndex > 0) {
      this._currentIndex--
      return this.blocks[this._currentIndex]
    }
    return null
  }

  skipTo(index: number): ContentBlock | null {
    if (index >= 0 && index < this.blocks.length) {
      this._currentIndex = index
      return this.blocks[index]
    }
    return null
  }

  clear(): void {
    this.blocks = []
    this._currentIndex = -1
  }

  getAll(): ContentBlock[] {
    return [...this.blocks]
  }

  getTransition(
    from: ContentBlock | null,
    to: ContentBlock
  ): string {
    if (!from) return this.getAnnouncement(to)
    if (from.type === to.type && to.type === "paragraph") return ""
    if (from.type === to.type) return ""
    return this.getAnnouncement(to)
  }

  private getAnnouncement(block: ContentBlock): string {
    const base = TYPE_ANNOUNCEMENTS[block.type]
    if (!base) return ""

    if (block.type === "heading" && block.level) {
      return `Heading level ${block.level}.`
    }
    if (block.type === "code" && block.language) {
      return `Code block, ${block.language}.`
    }
    return `${base}.`
  }
}

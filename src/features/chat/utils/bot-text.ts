export type BotTextBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] } | { kind: 'ordered'; items: string[] }

const LIST_LINE = /^\s*(?:[-*•])\s+(.*\S)\s*$/
const ORDERED_LINE = /^\s*\d+[.)]\s+(.*\S)\s*$/

/** The boards draw a model's "- item" lines as a gap-4 stack under the paragraph, without markers (ChatBotHeader); "1. item" lines are a numbered list (rule 30). */
export const splitBotText = (text: string): BotTextBlock[] => {
  const blocks: BotTextBlock[] = []
  for (const line of text.split('\n')) {
    const ordered = ORDERED_LINE.exec(line)?.[1]
    const item = ordered ?? LIST_LINE.exec(line)?.[1]
    const kind = ordered ? 'ordered' : 'list'
    const last = blocks.at(-1)
    if (item) {
      if (last?.kind === kind) last.items.push(item)
      else blocks.push({ kind, items: [item] })
    } else if (line.trim()) {
      if (last?.kind === 'paragraph') last.text += `\n${line.trim()}`
      else blocks.push({ kind: 'paragraph', text: line.trim() })
    }
  }
  return blocks
}

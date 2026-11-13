export type BotTextBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; items: string[] }

const LIST_LINE = /^\s*(?:[-*•])\s+(.*\S)\s*$/

/** The boards draw a model's "- item" lines as a gap-4 stack under the paragraph, without markers (ChatBotHeader). */
export const splitBotText = (text: string): BotTextBlock[] => {
  const blocks: BotTextBlock[] = []
  for (const line of text.split('\n')) {
    const item = LIST_LINE.exec(line)?.[1]
    const last = blocks.at(-1)
    if (item) {
      if (last?.kind === 'list') last.items.push(item)
      else blocks.push({ kind: 'list', items: [item] })
    } else if (line.trim()) {
      if (last?.kind === 'paragraph') last.text += `\n${line.trim()}`
      else blocks.push({ kind: 'paragraph', text: line.trim() })
    }
  }
  return blocks
}

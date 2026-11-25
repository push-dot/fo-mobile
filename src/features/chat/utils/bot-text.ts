export type BotTextBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'ordered'; items: string[] }
  | { kind: 'link'; label: string; route: string; tail: string }
  | { kind: 'heading'; level: 1 | 2; text: string }
  | { kind: 'sub'; text: string; route?: string }
  | TableBlock

export type TableBlock = { kind: 'table'; head: string[]; rows: string[][] }

const LIST_LINE = /^\s*[-*]\s+(.*\S)\s*$/
const BULLET_LINE = /^\s*•\s+(.*\S)\s*$/
const LINK_LINE = /^\[([^\]]+)\]\((\/[^)\s]*)\)(.*)$/
const ORDERED_LINE = /^\s*\d+[.)]\s+(.*\S)\s*$/
const HEADING_LINE = /^(#{1,6})\s+(.*\S)\s*$/
const SUB_LINE = /^>\s+(.*\S)\s*$/
const TABLE_LINE = /^\s*\|.*\|\s*$/
const TABLE_RULE = /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/

const cellsOf = (line: string) =>
  line
    .trim()
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll('\\|', '|'))

export const splitBotText = (text: string): BotTextBlock[] => {
  const blocks: BotTextBlock[] = []
  const lines = text.split('\n')
  for (let at = 0; at < lines.length; at++) {
    const line = lines[at]!
    if (TABLE_LINE.test(line) && TABLE_RULE.test(lines[at + 1] ?? '')) {
      const rows: string[][] = []
      let end = at + 2
      while (TABLE_LINE.test(lines[end] ?? '')) rows.push(cellsOf(lines[end++]!))
      blocks.push({ kind: 'table', head: cellsOf(line), rows })
      at = end - 1
      continue
    }
    const heading = HEADING_LINE.exec(line)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1]!.length < 3 ? 1 : 2, text: heading[2]! })
      continue
    }
    const sub = SUB_LINE.exec(line)?.[1]
    if (sub) {
      const to = LINK_LINE.exec(sub)
      blocks.push(to ? { kind: 'sub', text: `${to[1]}${to[3]}`, route: to[2]! } : { kind: 'sub', text: sub })
      continue
    }
    const link = LINK_LINE.exec(line.trim())
    if (link) {
      blocks.push({ kind: 'link', label: link[1]!, route: link[2]!, tail: link[3]!.trimEnd() })
      continue
    }
    const ordered = ORDERED_LINE.exec(line)?.[1]
    const bullet = BULLET_LINE.exec(line)?.[1]
    const item = ordered ?? bullet ?? LIST_LINE.exec(line)?.[1]
    const kind = ordered ? 'ordered' : bullet ? 'bullets' : 'list'
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

import type { ConversationRow } from '../api/schemas'

export type ConversationListRow =
  | { kind: 'header'; key: string; title: string; firstTitled?: boolean }
  | { kind: 'item'; key: string; row: ConversationRow }

type Grouped = { title?: string; rows: ConversationRow[] }[]

export const flattenConversationGroups = (grouped: Grouped): ConversationListRow[] => {
  const out: ConversationListRow[] = []
  let firstTitled = true
  for (const g of grouped) {
    if (g.title) {
      out.push({ kind: 'header', key: `header-${g.title}`, title: g.title, firstTitled })
      firstTitled = false
    }
    for (const r of g.rows) {
      out.push({ kind: 'item', key: r.id, row: r })
    }
  }
  return out
}

import type { ChatItem } from '../types'

const POSTING_READ = '공고 분석'

/** The header pill names the company once a posting is known: a result card, a read posting ("회사 · 직무"), or the conversation row. */
export const headerCompany = (items: ChatItem[], listed?: string | null) => {
  const result = items.findLast((i) => i.type === 'result')
  if (result?.company) return result.company
  const read = items.findLast((i) => i.type === 'tool' && i.action === POSTING_READ && i.state === 'ok')
  const fromRead = read?.type === 'tool' ? read.target?.split(' · ')[0] : undefined
  return fromRead || listed || undefined
}

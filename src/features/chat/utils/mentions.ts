import { searchHangul } from '@push/shared'

export type MentionItem = {
  id: string
  title: string
  sub: string
  kind: 'job' | 'doc' | 'link'
  tag?: string
}
export type MentionGroup = { title: string; items: MentionItem[] }

export const mentionQuery = (text: string): string | null => {
  const m = text.match(/(?:^|\s)@([^\s@]*)$/)
  return m ? m[1]! : null
}

export const insertMention = (text: string, title: string) => text.replace(/@([^\s@]*)$/, `@${title} `)

export const filterMentions = (groups: MentionGroup[], query: string) =>
  groups
    .map((g) => {
      const hits = new Set(searchHangul(g.items, query, (i) => [i.title, i.sub]).map(({ item }) => item))
      return { title: g.title, items: g.items.filter((i) => hits.has(i)) }
    })
    .filter((g) => g.items.length > 0)

const MENTION_RESERVE = 56 + 8 + 97

export const mentionMaxHeight = (windowHeight: number, insetTop: number, below: number) => Math.max(160, windowHeight - insetTop - below - MENTION_RESERVE)

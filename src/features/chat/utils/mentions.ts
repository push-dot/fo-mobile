import { searchHangul } from '@push/shared'

export type MentionItem = {
  id: string
  title: string
  sub: string
  kind: 'job' | 'doc' | 'link'
  /** Logo initial (jobs) or file tag (docs). */
  tag?: string
}
export type MentionGroup = { title: string; items: MentionItem[] }

/** The text typed after an "@" that starts a word at the end of the input, or null. */
export const mentionQuery = (text: string): string | null => {
  const m = text.match(/(?:^|\s)@([^\s@]*)$/)
  return m ? m[1]! : null
}

/** Replaces the trailing "@query" with "@title ". */
export const insertMention = (text: string, title: string) => text.replace(/@([^\s@]*)$/, `@${title} `)

// Typing filters the list and keeps the order of the full list (ChatEmpty draws 경력기술서 above 모아페이_맞춤_이력서 for "모아"); the match rank does not reorder it.
export const filterMentions = (groups: MentionGroup[], query: string) =>
  groups
    .map((g) => {
      const hits = new Set(searchHangul(g.items, query, (i) => [i.title, i.sub]).map(({ item }) => item))
      return { title: g.title, items: g.items.filter((i) => hits.has(i)) }
    })
    .filter((g) => g.items.length > 0)

const MENTION_RESERVE = 56 + 16 + 130

export const mentionMaxHeight = (windowHeight: number, insetTop: number, below: number) => Math.max(160, windowHeight - insetTop - below - MENTION_RESERVE)

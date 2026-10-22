import { matchHangul, searchHangul } from '@/shared/utility'

export type MentionItem = {
  id: string
  title: string
  sub: string
  kind: 'job' | 'doc' | 'link' | 'shortcut'
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

/** Keeps items whose title or sub matches (hangul-aware), drops empty groups, and marks the title match. */
export const filterMentions = (groups: MentionGroup[], query: string) =>
  groups
    .map((g) => ({
      title: g.title,
      items: searchHangul(g.items, query, (i) => [i.title, i.sub]).map(({ item }) => ({ ...item, hit: query ? matchHangul(item.title, query) : null })),
    }))
    .filter((g) => g.items.length > 0)

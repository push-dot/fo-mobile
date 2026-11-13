import type { Attachment } from '@/features/bots'
import type { LinkLabel, MadeBy, Material, MaterialKind, MaterialRowView, MaterialSection, MaterialsPage } from '../types'

const DAY = 24 * 60 * 60_000
/** A deadline this close shows its days left (Materials: "마감 11월 12일(D-3)"). */
const SOON_DAYS = 7

export const SECTION_OF: Record<MaterialKind, MaterialSection> = { file: 'doc', document: 'doc', posting: 'bookmark', link: 'link' }

/** Materials, MaterialsLong, MaterialDetailLink. */
export const LINK_LABEL: Record<LinkLabel, string> = {
  job: '채용 페이지',
  github: 'GitHub',
  portfolio: '포트폴리오',
  blog: '블로그',
  linkedin: 'LinkedIn',
  other: '기타',
}

export const monthDay = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Calendar days from `from` to `to`, whatever the hours: 11월 9일 23시 to 11월 10일 1시 is one. */
export const daysBetween = (from: Date, to: Date) => Math.round((startOfDay(to) - startOfDay(from)) / DAY)

export const deadlineLabel = (deadline: Date | null, now: Date): string => {
  if (deadline === null) return '상시 채용'
  const left = daysBetween(now, deadline)
  return left >= 0 && left <= SOON_DAYS ? `마감 ${monthDay(deadline)}(D-${left})` : `마감 ${monthDay(deadline)}`
}

export const madeByLabel = (madeBy: MadeBy): string => {
  if (madeBy.by === 'user') return '직접 올림'
  if (madeBy.bot === null) return '봇이 만듦'
  return madeBy.bot.kind === 'push' ? `${madeBy.bot.name}이 만듦` : `${madeBy.bot.name} 봇이 만듦`
}

/** "PDF" from "이력서.pdf". A title without an extension reads 파일. */
export const formatOf = (title: string) => /\.([a-z0-9]{1,5})$/i.exec(title)?.[1]?.toUpperCase() ?? '파일'

export const withoutScheme = (url: string) => url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')

/** The row's first line, also the title an attachment keeps. */
export const materialTitle = (m: Material): string =>
  m.kind === 'posting' ? `${m.company} · ${m.title}` : m.kind === 'link' ? withoutScheme(m.url) : m.title

const subOf = (m: Material, now: Date): string => {
  switch (m.kind) {
    case 'file':
      return `${formatOf(m.title)} · ${monthDay(m.updatedAt)} · ${madeByLabel(m.madeBy)}`
    case 'document':
      return `Push 서류 · ${monthDay(m.updatedAt)} · ${madeByLabel(m.madeBy)}`
    case 'posting':
      return `공고 · ${deadlineLabel(m.deadline, now)} · 북마크 ${monthDay(m.bookmarkedAt)}`
    case 'link':
      return `링크 · ${LINK_LABEL[m.linkKind]} · ${monthDay(m.addedAt)} 추가`
  }
}

export const materialRow = (m: Material, now: Date): MaterialRowView => ({ title: materialTitle(m), sub: subOf(m, now) })

export const toAttachment = (m: Material): Attachment => ({ kind: m.kind, id: m.id, title: materialTitle(m) })

export const totalCount = (counts: MaterialsPage['counts']): number => counts.doc + counts.bookmark + counts.link

/** The page after one material is gone: its row leaves and its section counts one less. */
export const withoutMaterial = (page: MaterialsPage, kind: MaterialKind, id: string): MaterialsPage => {
  const hit = page.sections.some((s) => s.items.some((m) => m.kind === kind && m.id === id))
  if (!hit) return page
  const section = SECTION_OF[kind]
  return {
    counts: { ...page.counts, [section]: Math.max(0, page.counts[section] - 1) },
    sections: page.sections.map((s) => ({ ...s, items: s.items.filter((m) => !(m.kind === kind && m.id === id)) })),
  }
}

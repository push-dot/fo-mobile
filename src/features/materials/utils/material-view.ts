import { EMPLOYMENT_TYPES } from '@push/api-client'
import { fileSize } from '@push/shared'
import type { BotId, BotRef } from '@/features/bots'
import { formatTime } from '@/shared/utility/picker-date'
import type { MadeBy, Material, MaterialKind, MaterialSection, MaterialsPage, MaterialTab, SendContext } from '../types'
import { daysBetween, formatOf, hostOf, LINK_LABEL, materialTitle, monthDay } from './material-row'

const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}

/** One row of the virtualised list: a section title or a material. */
export type ListRow =
  | { type: 'section'; key: string; section: MaterialSection; count: number }
  | { type: 'material'; key: string; material: Material }

/** What the list body draws. `empty` names the tab whose empty board applies, or the search. */
export type ListView =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'empty'; empty: MaterialTab | 'search' }
  | { state: 'list'; rows: ListRow[] }

export const listView = (list: { data: MaterialsPage | undefined; isError: boolean }, tab: MaterialTab, q: string): ListView => {
  if (!list.data) return { state: list.isError ? 'error' : 'loading' }
  const rows = list.data.sections.flatMap((s): ListRow[] =>
    s.items.length === 0
      ? []
      : [{ type: 'section', key: s.section, section: s.section, count: list.data!.counts[s.section] }, ...s.items.map((m): ListRow => ({ type: 'material', key: `${m.kind}:${m.id}`, material: m }))],
  )
  if (rows.length > 0) return { state: 'list', rows }
  return { state: 'empty', empty: q.trim() ? 'search' : tab }
}

/** MaterialsSearchEmpty: "‘회고 발표’와 맞는 자료가 없어요". */
export const searchEmptyTitle = (q: string) => {
  const word = q.trim()
  return `‘${word}’${hasBatchim(word) ? '과' : '와'} 맞는 자료가 없어요`
}

/** Opened from a bot (its profile), 보내기 attaches there; from the bot home it asks for a bot. */
export const sendContextOf = (forBot: string | undefined): SendContext => (forBot ? { from: 'bot', botId: forBot as BotId } : { from: 'home' })

const botName = (bot: BotRef) => (bot.kind === 'push' ? bot.name : `${bot.name} Bot`)

/** 만든 곳. A bot deleted since has no name to print, so the row hides. */
const madeByFact = (madeBy: MadeBy): string | null => (madeBy.by === 'user' ? '직접 올림' : madeBy.bot && botName(madeBy.bot))

const deadlineFact = (m: Extract<Material, { kind: 'posting' }>, now: Date): string => {
  if (m.deadline === null) return '상시 채용'
  const left = daysBetween(now, m.deadline)
  return m.closed || left < 0 ? `${monthDay(m.deadline)} (마감)` : `${monthDay(m.deadline)} (D-${left})`
}

const careerOf = (min: number | null, max: number | null): string | null => {
  if (min === null && max === null) return null
  if (!min && !max) return '신입'
  return max ? `${min ?? 0}–${max}년` : `${min}년 이상`
}

export type Fact = { label: string; value: string }

const facts = (rows: [string, string | null][]): Fact[] => rows.flatMap(([label, value]) => (value ? [{ label, value }] : []))

/** The detail sheet's facts, one table per kind. A fact the server does not have hides its row. 쓰인 대화 is a 서류 fact only. */
const FACTS: { [K in MaterialKind]: (m: Extract<Material, { kind: K }>, usedBy: BotRef[], now: Date) => Fact[] } = {
  file: (m, usedBy) =>
    facts([
      ['종류', [formatOf(m.title), m.pages === null ? null : `${m.pages}쪽`, fileSize(m.bytes)].filter(Boolean).join(' · ')],
      ['만든 곳', madeByFact(m.madeBy)],
      ['수정', `${monthDay(m.updatedAt)} ${formatTime(m.updatedAt)}`],
      ['쓰인 대화', usedBy.map(botName).join(', ')],
    ]),
  document: (m, usedBy) =>
    facts([
      ['종류', 'Push 서류'],
      ['만든 곳', madeByFact(m.madeBy)],
      ['수정', `${monthDay(m.updatedAt)} ${formatTime(m.updatedAt)}`],
      ['쓰인 대화', usedBy.map(botName).join(', ')],
    ]),
  posting: (m, _usedBy, now) =>
    facts([
      ['마감', deadlineFact(m, now)],
      ['경력', [careerOf(m.careerMin, m.careerMax), EMPLOYMENT_TYPES.find((t) => t.key === m.employmentType)?.label ?? null].filter(Boolean).join(' · ')],
      ['위치', m.location],
      ['북마크', monthDay(m.bookmarkedAt)],
    ]),
  link: (m) =>
    facts([
      ['주소', hostOf(m.url)],
      ['종류', LINK_LABEL[m.linkKind]],
      ['추가', monthDay(m.addedAt)],
    ]),
}

export const detailFacts = (m: Material, usedBy: BotRef[], now: Date): Fact[] => (FACTS[m.kind] as (m: Material, u: BotRef[], n: Date) => Fact[])(m, usedBy, now)

/** The sheet's title: a link shows its own name, every other kind its row title. */
export const detailTitle = (m: Material) => (m.kind === 'link' ? m.title : materialTitle(m))

const NOUN: Record<MaterialKind, string> = { file: '서류', document: '서류', posting: '북마크', link: '링크' }

/** MaterialDetailDelete, and the DeleteDoc toast after it. The nouns all end without a final consonant, so 를 and 는 hold. */
export const deleteCopy = (m: Material) => {
  const title = detailTitle(m)
  const noun = NOUN[m.kind]
  return {
    title: `‘${title}’${hasBatchim(title) ? '을' : '를'} 삭제할까요?`,
    body: '30일 뒤 완전히 지워져요.',
    done: `${noun}를 삭제했어요`,
    failed: `${noun}를 삭제하지 못했어요`,
  }
}

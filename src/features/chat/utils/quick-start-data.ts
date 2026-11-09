import { stageBadge, type Application, type Offer, type Posting, type Profile } from '@push/api-client'
import { brandColor, careerLabel, cardCareerLabel } from '@push/shared'
import { dday, givenName, stageTone, timeAgo } from '@/features/my'
import type { ChatDoc, QsData, QsItem } from '../api/schemas'
import type { QuickStart } from '../constants'

export type QsSources = {
  bookmarks?: Posting[]
  applications?: Application[]
  offers?: Offer[]
  follows?: Profile[]
  /** 최근 본 공고 (GET me/posting-views). Undefined → that segment is not shown. */
  recent?: Posting[]
  /** 허브 추천 (GET profiles?explore=recommended). Undefined → that segment is not shown. */
  recommended?: Profile[]
  profile?: Profile
  doc?: string
  connected?: boolean
}

const DAY = 86_400_000
const ACTIVE = new Set(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'])
// 합격 is listed under 진행 중 but starts unchecked: there is nothing left to organize.
const PRESELECT = new Set(['APPLIED', 'SCREENING', 'INTERVIEW'])

const job = (p: Pick<Posting, 'id' | 'company' | 'title'>, extra: Partial<QsItem> = {}): QsItem => ({
  id: p.id,
  over: p.company,
  title: p.title,
  logo: { text: [...p.company][0] ?? '', color: brandColor(p.company) },
  ...extra,
})
const person = (id: string, name: string, extra: Partial<QsItem> = {}): QsItem => ({
  id,
  title: name,
  avatar: { text: givenName(name), color: brandColor(name) },
  ...extra,
})

/** Same location · career line as the jobs list card. */
const where = (p: Posting) => [p.location, cardCareerLabel(p)].filter(Boolean).join(' · ')

/** First segment, plus a second one only when its source loaded (빠른 시작 › 부족한 점 찾기, 커피챗 제안 쓰기). */
const segmented = (first: string, items: QsItem[], second?: { label: string; items: QsItem[]; empty: string }): QsData =>
  second
    ? { segments: [first, second.label], items: [...items, ...second.items.map((it) => ({ ...it, seg: 1 }))], empty: [undefined, second.empty] }
    : { items }

// shortcut: AI-suggested items (경험 만들기, 커리어 글, 매칭 조건) stay empty until push-be suggests them.
export const quickStartFrom = (key: string, s: QsSources, now = new Date()): QsData => {
  const bookmarks = s.bookmarks ?? []
  switch (key) {
    case 'gap':
    case 'fit': {
      const items = bookmarks.map((p, i) => job(p, { sub: where(p), selected: i === 0 }))
      const recent = s.recent && { label: '최근 본 공고', items: s.recent.map((p) => job(p, { sub: where(p) })), empty: '최근 본 공고가 없어요.' }
      return { doc: s.doc, ...segmented(`북마크 ${bookmarks.length}`, items, recent) }
    }
    case 'boost':
      return { doc: s.doc, items: bookmarks.map((p, i) => job(p, { sub: where(p), selected: i === 0 })) }
    case 'deadline':
      return {
        items: bookmarks
          .filter((p) => p.deadline && Date.parse(p.deadline) - now.getTime() <= 7 * DAY && dday(p.deadline, now) !== '마감')
          .sort((a, b) => a.deadline!.localeCompare(b.deadline!))
          .map((p) => {
            const label = dday(p.deadline!, now)
            return job(p, { badge: { label, tone: label === 'D-Day' || Number(label.slice(2)) <= 3 ? 'red' : 'grey' } })
          }),
      }
    case 'status': {
      const all = (s.applications ?? []).map((a) => ({
        active: ACTIVE.has(a.stage),
        item: job({ id: a.id, company: a.company, title: a.title }, { badge: { label: stageBadge(a.stage), tone: stageTone(a.stage) }, selected: PRESELECT.has(a.stage) }),
      }))
      const active = all.filter((x) => x.active).map((x) => x.item)
      // An active application is listed under both tabs (same id, so one pick).
      return { segments: [`진행 중 ${active.length}`, `전체 ${all.length}`], items: [...active, ...all.map((x) => ({ ...x.item, seg: 1 }))] }
    }
    case 'reply':
      return {
        items: (s.offers ?? [])
          .filter((o) => o.status === 'SENT' || o.status === 'READ')
          .map((o) =>
            person(o.id, o.sender.displayName, {
              sub: o.posting ? `${o.posting.company} · ${o.posting.title}` : '',
              badge: o.status === 'SENT' ? { label: '새 제안', tone: 'ac' } : undefined,
              meta: timeAgo(o.createdAt, now),
              body: o.message,
            }),
          ),
      }
    case 'coffee': {
      const follows = (s.follows ?? []).map((p, i) => person(p.userId, p.displayName, { sub: p.headline, selected: i === 0 }))
      const hub = s.recommended && { label: '허브 추천', items: s.recommended.map((p) => person(p.userId, p.displayName, { sub: p.headline })), empty: '추천할 사람이 없어요.' }
      return segmented(`팔로잉 ${follows.length}`, follows, hub)
    }
    case 'hub':
      return {
        doc: s.doc,
        items: [
          { id: 'headline', title: '헤드라인', sub: '한 줄 소개', selected: true },
          { id: 'intro', title: '소개', sub: '3~4문장', selected: true },
          { id: 'careers', title: '경력', sub: s.profile?.careers && `${s.profile.careers.length}건` },
          { id: 'skills', title: '기술 스택', sub: s.profile?.skills && `${s.profile.skills.length}개` },
        ],
      }
    case 'calendar':
      return { items: [], calendar: { connected: !!s.connected } }
    default:
      return { doc: s.doc, items: [] }
  }
}

export const initialPicks = (qs: Pick<QuickStart, 'layout' | 'multi'>, items: QsItem[]) => {
  const chosen = items.filter((i) => i.selected).map((i) => i.id)
  return chosen.length || qs.layout !== 'cards' || qs.multi ? chosen : items.slice(0, 1).map((i) => i.id)
}

export const docMeta = (d: Pick<ChatDoc, 'fileName' | 'size' | 'createdAt'>) => {
  const at = new Date(d.createdAt)
  const size = d.size >= 1_000_000 ? `${(d.size / 1_000_000).toFixed(1)}MB` : `${Math.max(1, Math.round(d.size / 1000))}KB`
  return `${d.fileName.split('.').pop()!.toUpperCase()} · ${size} · ${at.getMonth() + 1}월 ${at.getDate()}일`
}

export const postingMeta = (p: Posting, now = new Date()) =>
  [p.location, p.careerMin === 0 && !p.careerMax ? careerLabel(p) : `경력 ${careerLabel(p)}`, p.deadline && dday(p.deadline, now)].filter(Boolean).join(' · ')

export const QS_NEEDS: Record<string, (keyof QsSources)[]> = {
  link: ['doc'],
  gap: ['bookmarks', 'recent', 'doc'],
  fit: ['bookmarks', 'recent', 'doc'],
  boost: ['bookmarks', 'doc'],
  deadline: ['bookmarks'],
  status: ['applications'],
  calendar: ['connected'],
  hub: ['doc', 'profile'],
  reply: ['offers'],
  coffee: ['follows', 'recommended'],
}

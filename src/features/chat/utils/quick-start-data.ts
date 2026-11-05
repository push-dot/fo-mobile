import { stageBadge, type Application, type Offer, type Posting, type Profile } from '@push/api-client'
import { cardCareerLabel } from '@push/shared'
import { dday, givenName, stageTone, timeAgo, tintOf } from '@/features/my'
import type { QsData, QsItem } from '../api/schemas'

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

const job = (p: Pick<Posting, 'id' | 'company' | 'title'>, extra: Partial<QsItem> = {}): QsItem => ({
  id: p.id,
  over: p.company,
  title: p.title,
  logo: { text: [...p.company][0] ?? '', color: tintOf(p.company) },
  ...extra,
})
const person = (id: string, name: string, extra: Partial<QsItem> = {}): QsItem => ({
  id,
  title: name,
  avatar: { text: givenName(name), color: tintOf(name) },
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
            return job(p, { badge: { label, tone: label === 'D-Day' || Number(label.slice(2)) <= 3 ? 'red' : 'orange' } })
          }),
      }
    case 'status': {
      const all = (s.applications ?? []).map((a) =>
        job({ id: a.id, company: a.company, title: a.title }, { badge: { label: stageBadge(a.stage), tone: stageTone(a.stage) }, selected: ACTIVE.has(a.stage) }),
      )
      const active = all.filter((it) => it.selected)
      // An active application is listed under both tabs (same id, so one pick).
      return { segments: [`진행 중 ${active.length}`, `전체 ${all.length}`], items: [...active, ...all.map((it) => ({ ...it, seg: 1 }))] }
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
          { id: 'careers', title: '경력', sub: s.profile?.careers ? `경력 · ${s.profile.careers.length}건` : '회사 · 역할' },
          { id: 'skills', title: '기술 스택', sub: s.profile?.skills ? `기술 스택 · ${s.profile.skills.length}개` : '쓰는 기술' },
        ],
      }
    case 'calendar':
      return { items: [], calendar: { connected: !!s.connected } }
    default:
      return { doc: s.doc, items: [] }
  }
}

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

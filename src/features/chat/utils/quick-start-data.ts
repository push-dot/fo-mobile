import { stageBadge, type Application, type Offer, type Posting, type Profile } from '@push/api-client'
import { dday, givenName, stageTone, timeAgo, tintOf } from '@/features/my'
import type { QsData, QsItem } from '../api/schemas'

export type QsSources = {
  bookmarks?: Posting[]
  applications?: Application[]
  offers?: Offer[]
  follows?: Profile[]
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

// shortcut: AI-suggested items (경험 만들기, 커리어 글, 매칭 조건) stay empty until push-be suggests them.
export const quickStartFrom = (key: string, s: QsSources, now = new Date()): QsData => {
  const bookmarks = s.bookmarks ?? []
  switch (key) {
    case 'gap':
    case 'fit':
      return { doc: s.doc, items: bookmarks.map((p, i) => job(p, { sub: p.location, selected: i === 0 })) }
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
    case 'status':
      return {
        items: (s.applications ?? []).map((a) =>
          job({ id: a.id, company: a.company, title: a.title }, { badge: { label: stageBadge(a.stage), tone: stageTone(a.stage) }, selected: ACTIVE.has(a.stage) }),
        ),
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
    case 'coffee':
      return { items: (s.follows ?? []).map((p, i) => person(p.userId, p.displayName, { sub: p.headline, selected: i === 0 })) }
    case 'hub':
      return {
        doc: s.doc,
        items: [
          { id: 'headline', title: '헤드라인', sub: '한 줄 소개', selected: true },
          { id: 'intro', title: '소개', sub: '3~4문장', selected: true },
          { id: 'careers', title: '경력', sub: '회사 · 역할' },
          { id: 'skills', title: '기술 스택', sub: '쓰는 기술' },
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
  gap: ['bookmarks', 'doc'],
  fit: ['bookmarks', 'doc'],
  deadline: ['bookmarks'],
  status: ['applications'],
  calendar: ['connected'],
  hub: ['doc'],
  reply: ['offers'],
  coffee: ['follows'],
}

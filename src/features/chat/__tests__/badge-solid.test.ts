import { stageBadge, type Application, type ApplicationStage, type Offer, type OfferStatus } from '@push/api-client'
import { describe, expect, it, vi } from 'vitest'
import { mockFetch } from '../../../mock/server'
import '../../../mock/chat'
import { offerBadge, stageSolid } from '../../my/utils/index'
import { QUICK_STARTS } from '../constants'
import type { QsData } from '../api/schemas'
import { quickStartFrom } from '../utils/quick-start-data'

vi.mock('@/features/my', async () => {
  const utils = await import('../../my/utils/index')
  return { dday: utils.dday, givenName: utils.givenName, stageSolid: utils.stageSolid, timeAgo: utils.timeAgo }
})

const STAGES = Object.keys({
  DISCOVERED: 1, PREPARING: 1, READY: 1, APPLIED: 1, SCREENING: 1, INTERVIEW: 1, OFFER: 1, ACCEPTED: 1, REJECTED: 1, WITHDRAWN: 1,
} satisfies Record<ApplicationStage, 1>) as ApplicationStage[]
const OFFER_STATUSES = Object.keys({ SENT: 1, READ: 1, ACCEPTED: 1, DECLINED: 1 } satisfies Record<OfferStatus, 1>) as OfferStatus[]

const labelWasSolid = (label: string) => label === '합격' || label === '수락함'

describe('badge solid parity with the old label match', () => {
  it('fills a stage badge exactly when its label is 합격', () => {
    for (const s of STAGES) expect(stageSolid(s), s).toBe(stageBadge(s) === '합격')
  })

  it('fills an offer badge exactly when its label is 수락함', () => {
    for (const status of OFFER_STATUSES)
      for (const box of ['received', 'sent'] as const) {
        const badge = offerBadge({ status }, box)
        expect(badge.solid, `${status} ${box}`).toBe(badge.label === '수락함')
      }
  })

  it('fills quick-start badges built from live data exactly where the label matched', () => {
    const applications = STAGES.map((stage) => ({ id: stage, company: '도토리', title: '서버', stage })) as Application[]
    const offers = OFFER_STATUSES.map((status) => ({ id: status, status, sender: { displayName: '오지현' }, message: '', createdAt: '2026-10-20T09:00:00Z' })) as unknown as Offer[]
    const badges = [...quickStartFrom('status', { applications }).items, ...quickStartFrom('reply', { offers }).items].flatMap((i) => (i.badge ? [i.badge] : []))
    expect(badges.length).toBeGreaterThan(STAGES.length)
    for (const b of badges) expect(!!b.solid, b.label).toBe(labelWasSolid(b.label))
  })

  it('fills mock quick-start badges exactly where the label matched', async () => {
    const badges = []
    for (const { key } of QUICK_STARTS) {
      const res = await mockFetch(new Request(`http://x/api/v1/chat/quick-starts/${key}`))
      const { data } = (await res.json()) as { data: QsData }
      badges.push(...data.items.flatMap((i) => (i.badge ? [i.badge] : [])))
    }
    expect(badges.some((b) => b.label === '합격')).toBe(true)
    for (const b of badges) expect(!!b.solid, b.label).toBe(labelWasSolid(b.label))
  })
})

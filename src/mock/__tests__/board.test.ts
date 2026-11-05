import { beforeAll, describe, expect, it } from 'vitest'

type Row = { id: string; title: string }
type Listed = { data: Row[]; page: { total?: number } }

const fetchJson = async <T>(path: string, init?: RequestInit) => {
  const { mockFetch } = await import('../server')
  return (await (await mockFetch(`http://x/api/v1/${path}`, init)).json()) as T
}

describe('mock data drawn on the design boards', () => {
  beforeAll(async () => {
    await import('../postings')
    await import('../home')
  })

  it('reports the board totals for the filters the boards draw', async () => {
    expect((await fetchJson<Listed>('postings')).page.total).toBe(1284)
    expect((await fetchJson<Listed>('postings?careerYears=4-6&limit=1')).page.total).toBe(386)
    expect((await fetchJson<Listed>('postings?employmentType=full_time&limit=1')).page.total).toBe(1021)
  })

  it('keeps the real count for other filters', async () => {
    const list = await fetchJson<Listed>('postings?category=dev&limit=50')
    expect(list.page.total).toBe(list.data.length)
  })

  it('shows the long titles only in the home 새로 올라온 공고 section', async () => {
    const home = await fetchJson<Listed>('postings?sort=latest&limit=10')
    expect(home.data[0]?.title).toBe('백엔드 엔지니어 (Kotlin·Spring) · 결제 플랫폼팀')
    const list = await fetchJson<Listed>('postings?sort=latest&limit=20')
    expect(list.data[0]?.title).toBe('백엔드 엔지니어 (Kotlin·Spring)')
  })

  it('orders 마감 임박 like the board', async () => {
    const list = await fetchJson<Listed>('postings?sort=deadline&deadlineWithin=7')
    expect(list.data.map((p) => p.id).slice(0, 4)).toEqual(['p2', 'p3', 'p5', 'p6'])
  })

  it('searches ‘백엔드’ with the board totals and row order', async () => {
    const found = await fetchJson<Listed>('search?q=백엔드&type=postings')
    expect(found.page.total).toBe(24)
    expect(found.data.slice(0, 6).map((p) => p.id)).toEqual(['p1', 'p9', 'p10', 'p3', 'p11', 'p12'])
    expect((await fetchJson<Listed>('search?q=백엔드&type=people')).page.total).toBe(8)
    expect((await fetchJson<Listed>('search?q=데브옵스 인턴&type=postings')).page.total).toBe(0)
  })

  it('has three unread notifications', async () => {
    const list = await fetchJson<{ data: { readAt: string | null }[] }>('me/notifications')
    expect(list.data.filter((n) => !n.readAt)).toHaveLength(3)
  })

  it('lets the phone code pick the outcome', async () => {
    const verify = (code: string) =>
      fetchJson<{ error?: { code: string }; data?: { accessToken: string } }>('auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+821012345678', code }),
      })
    expect((await verify('482111')).error?.code).toBe('PHONE_CODE_INVALID')
    expect((await verify('482222')).error?.code).toBe('PHONE_CODE_EXPIRED')
    expect((await verify('482333')).error?.code).toBe('RATE_LIMITED')
    expect((await verify('482915')).data?.accessToken).toBeTruthy()
  })

  it('leaves no 오늘 notifications after 모두 읽음', async () => {
    const { mockFetch } = await import('../server')
    await mockFetch('http://x/api/v1/me/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
    const list = await fetchJson<{ data: { id: string }[] }>('me/notifications')
    expect(list.data.map((n) => n.id)).toEqual(['n5', 'n6', 'n7', 'n8'])
  })
})

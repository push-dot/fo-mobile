import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

type Page = { data: { id: string; deadline: string | null }[] }

const get = async (query: string): Promise<Page> => {
  const { mockFetch } = await import('../server')
  const res = await mockFetch(`http://x/api/v1/postings?${query}`)
  return (await res.json()) as Page
}

describe('mock postings long after the sample was written', () => {
  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2027-06-01T03:00:00Z'))
    await import('../postings')
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  it('still lists the open dev postings', async () => {
    const list = await get('category=dev&limit=50')
    expect(list.data.map((p) => p.id)).toContain('p1')
  })

  it('still fills the closing-soon section', async () => {
    const list = await get('sort=deadline')
    expect(list.data.length).toBeGreaterThan(0)
  })
})

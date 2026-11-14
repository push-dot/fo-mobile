import { describe, expect, it } from 'vitest'

type Location = { location: string; count: number }

const locations = async (): Promise<Location[]> => {
  const { mockFetch } = await import('../server')
  await import('../postings')
  const res = await mockFetch('http://x/api/v1/postings/locations')
  return ((await res.json()) as { data: Location[] }).data
}

describe('mock 지역 counts (FilterRegion)', () => {
  it('lists the board\'s eleven 서울 districts in its order', async () => {
    const seoul = (await locations()).filter((d) => d.location.startsWith('서울 '))
    expect(seoul.map((d) => `${d.location.slice(3)} ${d.count}`)).toEqual([
      '강남구 214', '서초구 96', '마포구 88', '영등포구 71', '송파구 64', '성동구 58',
      '용산구 41', '중구 39', '종로구 33', '강서구 30', '구로구 27',
    ])
  })

  it('totals 서울 at the board\'s 842', async () => {
    const total = (await locations()).filter((d) => d.location === '서울' || d.location.startsWith('서울 ')).reduce((n, d) => n + d.count, 0)
    expect(total).toBe(842)
  })
})

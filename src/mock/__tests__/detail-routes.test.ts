import { expect, it } from 'vitest'

const get = async (path: string) => {
  await import('../index')
  const { mockFetch } = await import('../server')
  const res = await mockFetch(`http://x/api/v1/${path}`)
  return { status: res.status, body: (await res.json()) as { data: any } }
}

it('serves the job and profile detail calls the native bars make', async () => {
  expect((await get('postings/p1')).body.data).toMatchObject({ company: '모아페이', bookmarked: true, applied: false })
  expect((await get('profiles/u2')).body.data).toMatchObject({ displayName: '이하은', following: false })
  expect((await get('profiles/me')).body.data).toMatchObject({ displayName: '김서준', userId: 'me' })
})

it('follows the people the follow list shows, and keeps the board copy of the first offer row', async () => {
  await get('me/follows')
  expect((await get('profiles/u2')).body.data.following).toBe(true)
  const row = (await get('me/offers')).body.data[0]
  expect(row.message).toMatch(/^결제 플랫폼팀 시니어 포지션으로/)
  expect((await get('me/offers/o1')).body.data.message).toMatch(/^서준 님, 안녕하세요/)
})

it('draws 파도AI unmarked in the lists but in the bookmark list, and the short chip title in the offer sheet', async () => {
  expect((await get('postings/p2')).body.data.bookmarked).toBe(false)
  expect((await get('me/bookmarks')).body.data.map((p: { id: string }) => p.id)).toEqual(['p1', 'p7', 'p8', 'p2'])
  expect((await get('me/bookmarks?limit=10')).body.data[0].title).toBe('백엔드 엔지니어')
})

import { expect, it, vi } from 'vitest'

it('opens the accepted o1 thread with the typed reply, then the board reply', async () => {
  vi.useFakeTimers()
  await import('../index')
  const { mockFetch } = await import('../server')
  const accept = mockFetch('http://x/api/v1/me/offers/o1/accept', {
    method: 'POST',
    body: JSON.stringify({ reply: 'Thanks, lets talk' }),
  })
  await vi.runAllTimersAsync()
  await accept
  vi.useRealTimers()
  const { data } = (await (await mockFetch('http://x/api/v1/me/offers/o1/messages')).json()) as { data: { body: string }[] }
  expect(data.map((m) => m.body)).toEqual(['Thanks, lets talk', '목요일 저녁 7시, 강남역 근처 어떠세요?'])
})

it('leaves the accepted o1 thread empty when no reply was typed', async () => {
  vi.resetModules()
  vi.useFakeTimers()
  await import('../index')
  const { mockFetch } = await import('../server')
  const accept = mockFetch('http://x/api/v1/me/offers/o1/accept', { method: 'POST', body: JSON.stringify({}) })
  await vi.runAllTimersAsync()
  await accept
  vi.useRealTimers()
  const { data } = (await (await mockFetch('http://x/api/v1/me/offers/o1/messages')).json()) as { data: unknown[] }
  expect(data).toEqual([])
})

it('shows o1 as a thread opener with the aliased Android reply once accepted, after the detail with its own date', async () => {
  vi.resetModules()
  await import('../index')
  const { mockFetch } = await import('../server')
  const get = async () => ((await (await mockFetch('http://x/api/v1/me/offers/o1')).json()) as { data: { message: string; createdAt: string } }).data
  expect(new Date((await get()).createdAt).getUTCDate()).toBe(20)
  vi.useFakeTimers()
  const accept = mockFetch('http://x/api/v1/me/offers/o1/accept', { method: 'POST', body: JSON.stringify({ reply: 'Thank you' }) })
  await vi.runAllTimersAsync()
  await accept
  vi.useRealTimers()
  expect((await get()).message).toMatch(/30분 정도 커피챗 어떠세요\?$/)
  const { data } = (await (await mockFetch('http://x/api/v1/me/offers/o1/messages')).json()) as { data: { body: string }[] }
  expect(data[0]!.body).toMatch(/^제안 감사해요, 지현 님!/)
})

it('archives and blocks like push-be: gone from the default list, archived=1 lists the archived, unarchive brings it back', async () => {
  vi.resetModules()
  await import('../index')
  const { mockFetch } = await import('../server')
  const call = (path: string, method = 'GET', body?: unknown) =>
    mockFetch(`http://x/api/v1/${path}`, { method, body: body ? JSON.stringify(body) : undefined })
  const ids = async (path: string) => ((await (await call(path)).json()) as { data: { id: string }[] }).data.map((o) => o.id)

  expect(await ids('me/offers?box=received')).toContain('o2')
  expect(((await (await call('me/offers/o2/archive', 'POST')).json()) as { data: { archivedAt: string } }).data.archivedAt).toBeTruthy()
  expect(await ids('me/offers?box=received')).not.toContain('o2')
  expect(await ids('me/offers?box=received&archived=1')).toEqual(['o2'])
  await call('me/offers/o2/unarchive', 'POST')
  expect(await ids('me/offers?box=received')).toContain('o2')

  expect((await call('me/offers/o2/report', 'POST', {})).status).toBe(204)
  expect((await call('me/blocks', 'POST', { userId: 'u3' })).status).toBe(204)
  expect(await ids('me/offers?box=received')).not.toContain('o2')
  const blocks = (await (await call('me/blocks')).json()) as { data: { user: { id: string; displayName: string }; createdAt: string }[] }
  expect(blocks.data.map((b) => b.user)).toEqual([{ id: 'u3', displayName: '박도윤' }])
  await call('me/blocks/u3', 'DELETE')
  expect(await ids('me/offers?box=received')).toContain('o2')
})

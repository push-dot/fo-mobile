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
  expect(await ids('me/offers?box=received&archived=1')).toEqual(['o2', 'o8'])
  await call('me/offers/o2/unarchive', 'POST')
  expect(await ids('me/offers?box=received')).toContain('o2')

  expect((await call('me/offers/o2/report', 'POST', {})).status).toBe(204)
  expect((await call('me/blocks', 'POST', { userId: 'u3' })).status).toBe(204)
  expect(await ids('me/offers?box=received')).not.toContain('o2')
  const blocks = (await (await call('me/blocks')).json()) as { data: { user: { id: string; displayName: string }; createdAt: string }[] }
  expect(blocks.data.map((b) => b.user)).toContainEqual({ id: 'u3', displayName: '박도윤' })
  await call('me/blocks/u3', 'DELETE')
  expect(await ids('me/offers?box=received')).toContain('o2')
})

it('lists like push-be: box is required, totals count the whole box, and the seeded archived offer is the only one in the archive', async () => {
  vi.resetModules()
  await import('../index')
  const { mockFetch } = await import('../server')
  const get = async (path: string) => {
    const res = await mockFetch(`http://x/api/v1/${path}`)
    return { status: res.status, body: (await res.json()) as { data?: { id: string; archivedAt?: string | null }[]; page?: { total?: number }; error?: { code: string } } }
  }
  const bad = await get('me/offers')
  expect([bad.status, bad.body.error?.code]).toEqual([400, 'VALIDATION_ERROR'])
  expect((await get('me/offers?box=received&archived=2')).status).toBe(400)
  expect((await get('me/offers?box=received&limit=2')).body.page?.total).toBe(4)
  const archived = await get('me/offers?box=received&archived=1')
  expect(archived.body.page?.total).toBe(1)
  expect(archived.body.data?.[0]?.archivedAt).toBeTruthy()
  await mockFetch('http://x/api/v1/me/offers/o2/archive', { method: 'POST' })
  expect((await get('me/offers?box=received&archived=1')).body.page?.total).toBe(2)
  expect((await get('me/offers?box=received')).body.page?.total).toBe(3)
  expect(((await get('me/offers/o8')).body as unknown as { data: { archivedAt: string } }).data.archivedAt).toBeTruthy()
})

it('refuses messages and hub offers from people who blocked the viewer, like push-be (403 BLOCKED)', async () => {
  vi.resetModules()
  await import('../index')
  const { mockFetch } = await import('../server')
  const { setBlockedByThem } = await import('../me')
  const post = (path: string, body: unknown) => mockFetch(`http://x/api/v1/${path}`, { method: 'POST', body: JSON.stringify(body) })
  expect((await post('me/offers/o3/messages', { body: 'hi' })).status).toBe(201)
  setBlockedByThem(true)
  const res = await post('me/offers/o3/messages', { body: 'hi' })
  expect([res.status, ((await res.json()) as { error: { code: string } }).error.code]).toEqual([403, 'BLOCKED'])
  const hub = await post('profiles/u4/offer', { message: 'hello' })
  expect([hub.status, ((await hub.json()) as { error: { code: string } }).error.code]).toEqual([403, 'BLOCKED'])
  expect((await post('me/offers/o2/messages', { body: 'hi' })).status).toBe(409)
  setBlockedByThem(false)
  expect((await post('profiles/u4/offer', { message: 'hello' })).status).toBe(201)
})

it('makes the session user the recipient of every received offer and the sender of every sent one', async () => {
  vi.resetModules()
  await import('../index')
  const { mockFetch, MOCK_USER_ID } = await import('../server')
  type Row = { sender: { id: string }; recipient: { id: string } }
  const list = async (box: string) => ((await (await mockFetch(`http://x/api/v1/me/offers?box=${box}`)).json()) as { data: Row[] }).data
  const me = ((await (await mockFetch('http://x/api/v1/auth/me')).json()) as { data: { id: string } }).data.id
  expect(me).toBe(MOCK_USER_ID)
  expect((await list('received')).every((o) => o.recipient.id === MOCK_USER_ID)).toBe(true)
  expect((await list('sent')).every((o) => o.sender.id === MOCK_USER_ID)).toBe(true)
})

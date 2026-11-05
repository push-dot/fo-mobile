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

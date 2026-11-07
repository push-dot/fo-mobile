import { describe, expect, it } from 'vitest'
import { createClient } from '@push/api-client'
import { mock, mockFetch, page, setRules } from '../server'

mock('POST', 'echo/:id', ({ params, body, query }) => ({ data: { id: params.id, body, q: query.get('q') } }))

describe('mockFetch through the ky client', () => {
  it('routes a ky Request and parses its JSON body', async () => {
    const c = createClient({ baseUrl: 'http://x/api/v1', getToken: () => 't', fetch: mockFetch, uuid: () => 'k' })
    const out = await c.post<{ data: unknown }>('echo/7', { body: { a: 1 }, query: { q: '모아' } })
    expect(out.data).toEqual({ id: '7', body: { a: 1 }, q: '모아' })
  })
})

describe('tour rules', () => {
  const get = (path: string) => mockFetch(`http://x/api/v1/${path}`)
  mock('GET', 'rows', ({ query }) => page([1, 2, 3], query, true))

  it('fails, empties and then resets a route', async () => {
    setRules([{ kind: 'fail', method: 'GET', re: /^rows/ }])
    expect((await get('rows')).status).toBe(500)
    setRules([{ kind: 'empty', method: 'GET', re: /^rows/ }])
    expect(await (await get('rows')).json()).toEqual({ data: [], page: { nextCursor: null, hasMore: false, total: 0 } })
    setRules([{ kind: 'fail', method: 'GET', re: /^rows.*sort=a$/ }])
    expect((await get('rows?sort=a')).status).toBe(500)
    expect((await get('rows?sort=b')).status).toBe(200)
    setRules([])
    expect(((await (await get('rows')).json()) as { data: number[] }).data).toHaveLength(3)
  })
})

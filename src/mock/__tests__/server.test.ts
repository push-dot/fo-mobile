import { describe, expect, it } from 'vitest'
import { createClient } from '@push/api-client'
import { mock, mockFetch } from '../server'

mock('POST', 'echo/:id', ({ params, body, query }) => ({ data: { id: params.id, body, q: query.get('q') } }))

describe('mockFetch through the ky client', () => {
  it('routes a ky Request and parses its JSON body', async () => {
    const c = createClient({ baseUrl: 'http://x/api/v1', getToken: () => 't', fetch: mockFetch, uuid: () => 'k' })
    const out = await c.post<{ data: unknown }>('echo/7', { body: { a: 1 }, query: { q: '모아' } })
    expect(out.data).toEqual({ id: '7', body: { a: 1 }, q: '모아' })
  })
})

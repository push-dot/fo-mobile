import { describe, expect, it } from 'vitest'
import { createApi, createClient } from '@push/api-client'
import { mockFetch } from '../server'
import '../home'

describe('GET search/trending', () => {
  it('returns trending terms and skills through the api client', async () => {
    const api = createApi(createClient({ baseUrl: 'http://x/api/v1', getToken: () => 't', fetch: mockFetch, uuid: () => 'k' }))
    const trending = await api.searchTrending()
    expect(trending.terms.length).toBeGreaterThan(0)
    expect(trending.terms[0]).toEqual({ term: expect.any(String), count: expect.any(Number) })
    expect(trending.skills[0]).toEqual({ id: expect.any(String), count: expect.any(Number) })
  })
})

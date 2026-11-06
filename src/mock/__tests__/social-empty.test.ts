import { describe, expect, it } from 'vitest'
import { mockFetch } from '../server'
import { emptyFeed } from '../social'

const feed = async () => ((await (await mockFetch('http://x/api/v1/posts')).json()) as { data: unknown[] }).data

describe('social feed mock', () => {
  it('serves no posts once the empty-feed link has run', async () => {
    expect((await feed()).length).toBeGreaterThan(0)
    emptyFeed()
    expect(await feed()).toEqual([])
  })
})

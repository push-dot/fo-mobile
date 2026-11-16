import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch } from '../index'
import { resetDeadlineEvents } from '../calendar-deadlines'

const call = (method: string, path: string) => mockFetch(`http://x/api/v1/${path}`, { method })
const deadlines = async () => {
  const body = (await (
    await call(
      'GET',
      'calendar/events?from=2026-01-01T00:00:00.000Z&to=2099-01-01T00:00:00.000Z&limit=100',
    )
  ).json()) as { data: { id: string; type: string }[] }
  return body.data.filter((e) => e.id.startsWith('deadline-'))
}

beforeEach(() => resetDeadlineEvents())

describe('deadline events follow bookmark and apply', () => {
  it('bookmark adds the posting deadline, un-bookmark removes it', async () => {
    await call('POST', 'postings/p2/bookmark')
    expect((await deadlines()).map((e) => e.type)).toEqual(['DEADLINE'])
    await call('DELETE', 'postings/p2/bookmark')
    expect(await deadlines()).toEqual([])
  })

  it('apply keeps the event after un-bookmark', async () => {
    await call('POST', 'postings/p2/apply')
    await call('DELETE', 'postings/p2/bookmark')
    expect(await deadlines()).toHaveLength(1)
  })
})

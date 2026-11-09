import { describe, expect, it } from 'vitest'
import './me'
import { mockFetch } from './server'

const call = async (method: string, path: string, body?: unknown) => {
  const res = await mockFetch(`http://x/api/v1/${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  })
  return { status: res.status, json: res.status === 204 ? null : await res.json() }
}

describe('mock me/blocks like push-be', () => {
  it('lists the newest block first with the total, and unblocking removes the row', async () => {
    const list = await call('GET', 'me/blocks')
    expect(list.json.data.map((b: { user: { displayName: string } }) => b.user.displayName)).toEqual(['오지현', '한민재'])
    expect(list.json.page.total).toBe(2)

    const removed = await call('DELETE', 'me/blocks/u-blocked-jihyun')
    expect(removed.status).toBe(204)
    const after = await call('GET', 'me/blocks')
    expect(after.json.data).toHaveLength(1)
    expect(after.json.page.total).toBe(1)
  })

  it('rejects a bad limit with VALIDATION_ERROR', async () => {
    const res = await call('GET', 'me/blocks?limit=0')
    expect(res.status).toBe(400)
    expect(res.json.error.code).toBe('VALIDATION_ERROR')
  })
})

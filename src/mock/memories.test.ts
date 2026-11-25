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

describe('mock me/memories like push-be', () => {
  it('lists, edits, deletes one and clears all', async () => {
    const list = await call('GET', 'me/memories')
    expect(list.json.data).toHaveLength(3)

    const edited = await call('PATCH', 'me/memories/mem-size', { text: '  100명 이하 회사를 선호해요.  ' })
    expect(edited.json.data.text).toBe('100명 이하 회사를 선호해요.')
    expect((await call('GET', 'me/memories')).json.data[0].id).toBe('mem-size')

    expect((await call('PATCH', 'me/memories/mem-size', { text: '   ' })).status).toBe(400)
    expect((await call('PATCH', 'me/memories/mem-size', { text: '가'.repeat(301) })).status).toBe(400)
    expect((await call('PATCH', 'me/memories/nope', { text: '없어요' })).status).toBe(404)

    expect((await call('DELETE', 'me/memories/mem-remote')).status).toBe(204)
    expect((await call('GET', 'me/memories')).json.data).toHaveLength(2)

    expect((await call('DELETE', 'me/memories')).status).toBe(204)
    expect((await call('GET', 'me/memories')).json.data).toEqual([])
  })
})

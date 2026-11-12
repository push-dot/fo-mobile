import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch } from '../../../../mock'
import { resetBots } from '../../../../mock/bots'

beforeEach(() => resetBots())

const read = async (path: string, method = 'GET') => {
  const res = await mockFetch(`http://x/api/v1/${path}`, { method })
  return { status: res.status, body: res.status === 204 ? null : ((await res.json()) as { data: { host: string; kind: string }[] }) }
}

describe('site grant routes', () => {
  it('lists the board hosts for a company bot and for Push Bot, and a second revoke is still gone', async () => {
    const moa = await read('bots/b-moa/site-grants')
    expect(moa.status).toBe(200)
    expect(moa.body?.data.map((grant) => [grant.host, grant.kind])).toEqual([
      ['careers.moapay.co.kr', 'posting'],
      ['moapay.notion.site', 'company'],
    ])
    expect((await read('bots/b-moa/site-grants/careers.moapay.co.kr', 'DELETE')).status).toBe(204)
    expect((await read('bots/b-moa/site-grants/careers.moapay.co.kr', 'DELETE')).status).toBe(204)
    expect((await read('bots/b-moa/site-grants')).body?.data.map((grant) => grant.host)).toEqual(['moapay.notion.site'])
    expect((await read('bots/push/site-grants')).body?.data.map((grant) => grant.host)).toEqual([
      'careers.moapay.co.kr',
      'nuricloud.career.greetinghr.com',
    ])
    expect((await read('bots/missing/site-grants')).status).toBe(404)
  })
})

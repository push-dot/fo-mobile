import { beforeEach, describe, expect, it } from 'vitest'
import { createBotApi, createClient } from '@push/api-client'
import { mockFetch } from '../index'
import { resetBots, setGrants, setBots } from '../bots'

const api = createBotApi(createClient({ baseUrl: 'http://x/api/v1', getToken: () => 't', fetch: mockFetch, uuid: () => 'k' }))
const grants = async (id: string) => (await mockFetch(`http://x/api/v1/bots/${id}/site-grants`, {})).json() as Promise<{ data: unknown[] }>
const get = async (path: string) => (await mockFetch(`http://x/api/v1/${path}`, {})).json() as Promise<{ data: { title: string; company: string }[] | { title: string; company: string } }>

beforeEach(() => resetBots())

describe('grants switch (BotProfile draws 모아페이 without the 허용한 사이트 row)', () => {
  it('none empties every bot, seed brings the seed back, reset does the same', async () => {
    expect((await grants('b-moa')).data).toHaveLength(2)
    setGrants('none')
    expect((await grants('b-moa')).data).toHaveLength(0)
    expect((await grants('push')).data).toHaveLength(0)
    setGrants('seed')
    expect((await grants('b-moa')).data).toHaveLength(2)
    setGrants('none')
    resetBots()
    expect((await grants('b-moa')).data).toHaveLength(2)
  })
})

describe('p-moa-short (BotNewLinkPicked, BotNewXL)', () => {
  it('is 모아페이 with the board title, opens the form only without the 모아페이 Bot, and is in no list', async () => {
    const posting = (await get('postings/p-moa-short')).data as { title: string; company: string }
    expect([posting.company, posting.title]).toEqual(['모아페이', '백엔드 엔지니어'])
    expect((await api.bots.list({ postingId: 'p-moa-short' })).data).toHaveLength(1)
    setBots('none')
    expect((await api.bots.list({ postingId: 'p-moa-short' })).data).toHaveLength(0)
    const list = (await get('postings?q=%EB%AA%A8%EC%95%84')).data as { title: string }[]
    expect(list.map((p) => p.title)).not.toContain('백엔드 엔지니어')
  })
})

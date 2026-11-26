import { MutationObserver, QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@push/api-client'
import type { Bot, BotId, BotProfile, CompanyBot } from '../types'

const updateBot = vi.fn()
vi.mock('../api/fetchers', () => ({ fetchBots: vi.fn(), updateBot: (...args: unknown[]) => updateBot(...args) }))
const showToast = vi.fn()
vi.mock('@/shared/components/toast-store', () => ({ showToast: (...args: unknown[]) => showToast(...args) }))
const { patchBotMutation } = await import('../api/hooks')

const moapay: CompanyBot = {
  id: 'b1' as BotId, kind: 'company', name: '모아페이', color: 'teal', postingId: 'p1', muted: false, revision: 3,
  lastActivityAt: new Date(2026, 10, 9), lastMessage: null, unread: false, activity: { phase: 'idle' }, outcome: null,
}
const LIST = ['bots', 'list']
const DETAIL = ['bots', 'detail', 'b1']

let qc: QueryClient
const listed = () => qc.getQueryData<{ bots: Bot[] }>(LIST)?.bots[0]
const profiled = () => qc.getQueryData<BotProfile>(DETAIL)?.bot

beforeEach(() => {
  updateBot.mockReset()
  showToast.mockReset()
  qc = new QueryClient()
  qc.setQueryData(LIST, { bots: [moapay], limit: undefined })
  qc.setQueryData(DETAIL, { bot: moapay, posting: null, fitScore: null, materialCount: 8 })
})

const patch = (vars: Parameters<ReturnType<typeof patchBotMutation>['mutationFn']>[0]) =>
  new MutationObserver(qc, patchBotMutation(qc)).mutate(vars).catch((e: unknown) => e)

describe('changing a bot colour or mute', () => {
  it('draws the change at once and sends the revision it was made on', async () => {
    let answer!: (bot: Bot) => void
    updateBot.mockReturnValue(new Promise((r) => (answer = r)))
    const done = patch({ bot: moapay, patch: { color: 'red', notificationsMuted: true } })
    await vi.waitFor(() => expect(listed()).toMatchObject({ color: 'red', muted: true }))
    expect(profiled()).toMatchObject({ color: 'red', muted: true })
    expect(updateBot).toHaveBeenCalledWith('b1', { expectedRevision: 3, color: 'red', notificationsMuted: true })
    answer({ ...moapay, color: 'red', muted: true, revision: 4 })
    await done
    expect(listed()?.revision).toBe(4)
  })

  it('sends the second change on the revision the first one returned', async () => {
    updateBot.mockImplementation((_id: BotId, body: { expectedRevision: number }) =>
      Promise.resolve({ ...moapay, revision: body.expectedRevision + 1 }),
    )
    await Promise.all([patch({ bot: moapay, patch: { color: 'red' } }), patch({ bot: moapay, patch: { notificationsMuted: true } })])
    expect(updateBot.mock.calls.map(([, body]) => body.expectedRevision)).toEqual([3, 4])
    expect(listed()?.revision).toBe(5)
  })

  it('rolls back on REVISION_CONFLICT and reloads the bots', async () => {
    updateBot.mockRejectedValue(new ApiError('changed', 'REVISION_CONFLICT', 409, { currentRevision: 4 }))
    const error = await patch({ bot: moapay, patch: { color: 'red' } })
    expect(error).toBeInstanceOf(ApiError)
    expect(listed()).toEqual(moapay)
    expect(profiled()).toEqual(moapay)
    expect(qc.getQueryState(LIST)?.isInvalidated).toBe(true)
  })

  it('rolls back on any other failure without a reload', async () => {
    updateBot.mockRejectedValue(new Error('offline'))
    await patch({ bot: moapay, patch: { notificationsMuted: true } })
    expect(listed()).toEqual(moapay)
    expect(qc.getQueryState(LIST)?.isInvalidated).toBe(false)
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledWith({ message: '처리하지 못했어요', tone: 'error' })
  })
})

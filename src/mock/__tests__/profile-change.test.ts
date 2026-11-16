import { describe, expect, it } from 'vitest'
import { mockFetch } from '../server'
import { recordRun } from '../bots'
import '../bot-chat'
import { botProfileChange, myProfile } from '../me'
import { PROFILE_CHANGE_ASK, PROFILE_CHANGE_HEADLINE, PROFILE_CHANGE_REPLY } from '../bot-scripts/runs'

const call = (method: string, path: string) => mockFetch(new Request(`http://x/api/v1/${path}`, { method }))

describe('a Bot profile change in the mock', () => {
  it('keeps the old headline under the change id, undoes it once, and answers 409 the second time', async () => {
    const before = myProfile().headline
    const id = botProfileChange(PROFILE_CHANGE_HEADLINE)
    expect(myProfile().headline).toBe(PROFILE_CHANGE_HEADLINE)
    expect(((await (await call('GET', `me/profile/changes/${id}`)).json()) as { data: unknown }).data).toMatchObject({ id, fields: ['headline'], undone: false })

    const undone = await call('POST', `me/profile/changes/${id}/undo`)
    expect(undone.status).toBe(200)
    expect(((await undone.json()) as { data: { headline: string } }).data.headline).toBe(before)
    expect(myProfile().headline).toBe(before)
    expect(((await (await call('GET', `me/profile/changes/${id}`)).json()) as { data: { undone: boolean } }).data.undone).toBe(true)
    expect((await call('POST', `me/profile/changes/${id}/undo`)).status).toBe(409)
  })

  it('is 404 for a change that is not there', async () => {
    expect((await call('GET', 'me/profile/changes/nope')).status).toBe(404)
    expect((await call('POST', 'me/profile/changes/nope/undo')).status).toBe(404)
  })

  it('is stored in the thread: the reopened transcript carries the update_my_profile line with the change id', async () => {
    const id = botProfileChange(PROFILE_CHANGE_HEADLINE)
    recordRun('b-push', PROFILE_CHANGE_ASK, PROFILE_CHANGE_REPLY, id)
    const body = (await (await call('GET', 'bots/b-push/transcript')).json()) as { data: { events: { type: string; name?: string; result?: { changeId?: string } }[] }[] }
    const tool = body.data[0]!.events.find((e) => e.type === 'tool')
    expect(tool).toMatchObject({ name: 'update_my_profile', result: { changeId: id } })
  })
})

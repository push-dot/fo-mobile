import { createApi, createClient } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { mockFetch } from '@/mock'
import { restoreLinkFailure } from './link-restore'

const api = createApi(createClient({ baseUrl: 'http://x/api/v1', getToken: () => 'token', fetch: mockFetch, uuid: () => 'k' }))

describe('link undo', () => {
  it('says a hard-deleted link is already gone instead of asking to retry', async () => {
    const error = await api.me.restoreLink('l-replaced').catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 404 })
    expect(restoreLinkFailure(error)).toEqual(['이미 정리된 링크예요'])
  })

  it('asks to retry any other failure', () => {
    expect(restoreLinkFailure(new Error('offline'))).toEqual(['되돌리지 못했어요', '잠시 뒤에 다시 해 주세요.'])
  })
})

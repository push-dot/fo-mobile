import { describe, expect, it } from 'vitest'
import { routeA2uiAction } from './a2ui-action'

const message = (name: string, context: unknown, version = 'v0.9.1') =>
  JSON.stringify({ version, action: { name, surfaceId: 's1', sourceComponentId: 'choice', timestamp: '2026-11-23T00:00:00Z', context } })

describe('routeA2uiAction', () => {
  it('routes an answer of the interactive surface with the body the shared helper builds, in either protocol version', () => {
    expect(routeA2uiAction(message('answer', { optionId: 'approve' }), true)).toEqual({ kind: 'answer', surfaceId: 's1', body: { optionId: 'approve' } })
    expect(routeA2uiAction(message('answer', { optionId: 'resume', optionIds: ['resume', 'cover_letter'] }, '1.0'), true)).toEqual({
      kind: 'answer',
      surfaceId: 's1',
      body: { optionId: 'resume', optionIds: ['resume', 'cover_letter'] },
    })
    expect(routeA2uiAction(message('answer', { optionId: 'submit', optionIds: ['submit', 'resume', 'm_file', 'preserve'] }), true)).toMatchObject({
      body: { optionId: 'submit', optionIds: ['submit', 'resume', 'm_file', 'preserve'] },
    })
  })

  it('drops an answer from any other surface, and a malformed one', () => {
    expect(routeA2uiAction(message('answer', { optionId: 'approve' }), false)).toBeNull()
    expect(routeA2uiAction(message('answer', {}), true)).toBeNull()
    expect(routeA2uiAction(message('answer', { optionId: 7 }), true)).toBeNull()
    expect(routeA2uiAction('not json', true)).toBeNull()
  })

  it('runs a result action only from the allowlist, without the method or path the surface names', () => {
    expect(routeA2uiAction(message('result_action', { id: 'convert', method: 'POST', path: '/api/v1/documents/d1/profile' }), false)).toEqual({
      kind: 'local',
      surfaceId: 's1',
      action: { name: 'result_action', id: 'convert' },
    })
    expect(routeA2uiAction(message('result_action', { id: 'delete_account', method: 'DELETE', path: '/api/v1/me' }), false)).toBeNull()
  })

  it('passes the other local actions on with only the context they need, whether or not the surface waits', () => {
    expect(routeA2uiAction(message('open_review', { documentId: 'd1' }), false)).toMatchObject({ action: { name: 'open_review', documentId: 'd1' } })
    expect(routeA2uiAction(message('share', { documentId: 'd1', extra: 'x' }), false)).toEqual({ kind: 'local', surfaceId: 's1', action: { name: 'share', documentId: 'd1' } })
    expect(routeA2uiAction(message('open_plan', {}), false)).toMatchObject({ action: { name: 'open_plan' } })
    expect(routeA2uiAction(message('change', { optionId: 'm_file' }), true)).toMatchObject({ action: { name: 'change', optionId: 'm_file' } })
    expect(routeA2uiAction(message('open_posting', { postingId: 'p1' }), false)).toMatchObject({ action: { name: 'open_posting', postingId: 'p1' } })
    expect(routeA2uiAction(message('open_review', {}), false)).toBeNull()
  })

  it('ignores names it does not know', () => {
    expect(routeA2uiAction(message('openUrl', { url: 'https://example.com' }), true)).toBeNull()
  })
})

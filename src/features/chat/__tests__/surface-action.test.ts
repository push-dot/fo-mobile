import type { A2uiFrame } from '@push/api-client'
import result from '@push/api-client/a2ui-fixtures/result.json'
import resultSaveFailed from '@push/api-client/a2ui-fixtures/result-save-failed.json'
import { describe, expect, it, vi } from 'vitest'
import { SAVE_RETRY_TEXT } from '../constants'
import { emptyChat } from '../utils/reducer'
import type { SurfaceItem } from '../utils/surface'
import { runSurfaceAction, type SurfaceActionEffects } from '../utils/surface-action'
import type { ChatState } from '../types'

const card = (json: unknown, id: string): SurfaceItem => {
  const f = json as A2uiFrame
  return { type: 'surface', id, kind: f.kind, messages: JSON.parse(JSON.stringify(f.messages).replaceAll(`"${f.surfaceId}"`, JSON.stringify(id))) }
}
const effects = (): SurfaceActionEffects => ({
  send: vi.fn(), openDocument: vi.fn(), openReview: vi.fn(), openPlan: vi.fn(), openPosting: vi.fn(), share: vi.fn(), convert: vi.fn(), change: vi.fn(),
})
const idle = (...items: SurfaceItem[]): ChatState => ({ ...emptyChat, items })
const working = (...items: SurfaceItem[]): ChatState => ({ ...idle(...items), working: { verbs: ['지원하는 중'], startedAt: 0 } })

describe('result card actions', () => {
  const made = card(result, 'made')

  it('sends the apply message once: a second tap while that run works does nothing', () => {
    const fx = effects()
    runSurfaceAction(idle(made), made, { name: 'result_action', id: 'apply' }, fx)
    runSurfaceAction(working(made), made, { name: 'result_action', id: 'apply' }, fx)
    expect(fx.send).toHaveBeenCalledTimes(1)
    expect(fx.send).toHaveBeenCalledWith(expect.stringContaining('지원'))
  })

  it('does nothing for apply while messages wait in the queue', () => {
    const fx = effects()
    runSurfaceAction({ ...idle(made), queue: [{ text: '다른 질문' }] }, made, { name: 'result_action', id: 'apply' }, fx)
    expect(fx.send).not.toHaveBeenCalled()
  })

  it('retries a failed save only from the newest result card, and only once while the retry runs', () => {
    const older = card(resultSaveFailed, 'older-failed')
    const newest = card(resultSaveFailed, 'newest-failed')
    const fx = effects()
    runSurfaceAction(idle(older, newest), older, { name: 'result_action', id: 'retry_save' }, fx)
    expect(fx.send).not.toHaveBeenCalled()
    runSurfaceAction(idle(older, newest), newest, { name: 'result_action', id: 'retry_save' }, fx)
    runSurfaceAction(working(older, newest), newest, { name: 'result_action', id: 'retry_save' }, fx)
    expect(fx.send).toHaveBeenCalledTimes(1)
    expect(fx.send).toHaveBeenCalledWith(SAVE_RETRY_TEXT)
  })

  it('keeps view and share working on an older result card while the Bot works', () => {
    const older = card(result, 'older')
    const fx = effects()
    runSurfaceAction(working(older, made), older, { name: 'result_action', id: 'view' }, fx)
    runSurfaceAction(working(older, made), older, { name: 'share', documentId: 'd1' }, fx)
    expect(fx.openDocument).toHaveBeenCalledTimes(1)
    expect(fx.share).toHaveBeenCalledWith('d1', expect.any(String))
  })
})

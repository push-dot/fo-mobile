import type { Application } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { appliedOnly } from './applied-only'

const app = (id: string, stage: Application['stage'], appliedAt: string | null) => ({ id, stage, appliedAt }) as Application

describe('appliedOnly', () => {
  it('drops applications push-be lists before they are sent', () => {
    const list = [
      app('a1', 'APPLIED', '2026-10-14T00:00:00Z'),
      app('a2', 'DISCOVERED', null),
      app('a3', 'PREPARING', null),
      app('a4', 'READY', null),
    ]
    expect(appliedOnly(list).map((a) => a.id)).toEqual(['a1'])
  })

  it('keeps imported applications that never recorded appliedAt', () => {
    const list = [app('a1', 'SCREENING', null), app('a2', 'REJECTED', null), app('a3', 'OFFER', null), app('a4', 'WITHDRAWN', null)]
    expect(appliedOnly(list)).toHaveLength(4)
  })

  it('keeps a not-yet-sent stage once appliedAt is set', () => {
    expect(appliedOnly([app('a1', 'READY', '2026-10-14T00:00:00Z')])).toHaveLength(1)
  })
})

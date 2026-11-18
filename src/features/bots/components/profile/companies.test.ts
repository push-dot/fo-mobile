import { describe, expect, it } from 'vitest'
import type { Bot } from '../../types'
import { companyNames } from './companies'

const bot = (kind: 'push' | 'company', name: string) => ({ kind, name }) as Bot

describe('companyNames', () => {
  it('skips the Push Bot and repeats and keeps order', () => {
    expect(companyNames([bot('push', 'Push Bot'), bot('company', '모아페이'), bot('company', '도토리증권'), bot('company', '모아페이')])).toEqual(['모아페이', '도토리증권'])
  })

  it('is empty before the list loads', () => {
    expect(companyNames(undefined)).toEqual([])
  })
})

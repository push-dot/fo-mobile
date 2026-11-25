import { describe, expect, it } from 'vitest'
import { accessLabel, accessMenu } from './access-mode'

describe('accessMenu', () => {
  it('offers the three modes under the sheet title and marks the saved one', () => {
    const picked: string[] = []
    const [section] = accessMenu('ALWAYS_ASK', (mode) => picked.push(mode))
    expect(section!.title).toBe('봇이 어떻게 실행할까요?')
    expect(section!.actions.map((a) => [a.label, a.selected])).toEqual([
      ['항상 묻기', true],
      ['자동', false],
      ['바로 실행', false],
    ])
    section!.actions[2]!.onPress()
    expect(picked).toEqual(['BYPASS'])
  })

  it('reads a missing setting as 자동', () => {
    expect(accessLabel(undefined)).toBe('자동')
    expect(accessMenu(null, () => undefined)[0]!.actions.find((a) => a.selected)?.key).toBe('AUTO')
  })
})

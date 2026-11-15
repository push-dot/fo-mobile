import { describe, expect, it } from 'vitest'
import { closeLabel } from '../utils/close-label'

describe('closeLabel', () => {
  it('turns every stop label into 닫기', () => {
    expect(['그만하기', '취소'].map(closeLabel)).toEqual(['닫기', '닫기'])
    expect(closeLabel('그만할게요')).toBe('그만할게요')
  })

  it('leaves other labels alone', () => {
    expect(closeLabel('확인했어요')).toBe('확인했어요')
  })
})

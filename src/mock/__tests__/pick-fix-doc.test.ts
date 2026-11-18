import { describe, expect, it } from 'vitest'
import { pick } from '../bot-scripts/runs'

describe('pick: 이 서류를 고쳐 줘', () => {
  const labelsOf = (r: ReturnType<typeof pick>) => r?.steps.length

  it('plays the read-then-fix run for 이 서류를 고쳐 줘 even with the file name attached', () => {
    const withFile = pick('이 서류를 고쳐 줘', false, '김서준_백엔드_이력서_2026.pdf')
    expect(withFile).toEqual(pick('이 서류를 고쳐 줘', false))
    expect(withFile?.labels).toBeDefined()
  })

  it('still plays the external file run for any other attachment', () => {
    expect(labelsOf(pick('이거 봐 줘', false, 'a.pdf'))).not.toBe(labelsOf(pick('이 서류를 고쳐 줘', false)))
  })
})

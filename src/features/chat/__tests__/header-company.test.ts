import { describe, expect, it } from 'vitest'
import type { ChatItem } from '../types'
import { headerCompany } from '../utils/header-company'

const read = (state: 'run' | 'ok'): ChatItem => ({ type: 'tool', id: 'jd', action: '공고 분석', target: '모아페이 · 백엔드 엔지니어', state })
const resume: ChatItem = { type: 'tool', id: 'resume', action: '이력서 읽기', target: '김서준_백엔드_이력서_2026.pdf', state: 'ok' }

describe('headerCompany', () => {
  it('stays logo-only until a posting is known', () => {
    expect(headerCompany([resume], null)).toBeUndefined()
    expect(headerCompany([resume, read('run')], undefined)).toBeUndefined()
  })

  it('names the company as soon as the posting is read', () => {
    expect(headerCompany([resume, read('ok')], null)).toBe('모아페이')
  })

  it('falls back to the conversation row', () => {
    expect(headerCompany([resume], '라온헬스')).toBe('라온헬스')
  })
})

import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_REFERENCE_NOTE,
  ACCOUNT_REFERENCE_TITLE,
  CONSENT_BODY,
  CONSENT_TITLE,
  PLAN_HEADER,
  docAiSub,
  linkMentionSub,
} from '../constants'

describe('agent s copy', () => {
  it('access mode title', () => {
  })

  it('consent title and body', () => {
    expect(CONSENT_TITLE).toBe('Bot을 쓰려면 동의가 필요해요')
    expect(CONSENT_BODY).toBe('내 서류를 다른 Bot이 참고 자료로 써요.')
    expect(CONSENT_BODY).not.toContain('기업의 AI')
  })

  it('plan header and footer', () => {
    expect(PLAN_HEADER).toBe('플랜마다\n쓸 수 있는 양이 달라요')
    expect(ACCOUNT_REFERENCE_TITLE).toBe('Bot이 참고하는 내 정보')
    expect(ACCOUNT_REFERENCE_NOTE).toBe('대화를 시작할 때 Bot이 이 정보부터 읽어요.')
  })

  it('mention rows read the way the boards draw them', () => {
    expect(docAiSub('방금')).toBe('Bot으로 만듦 · 방금')
    expect(linkMentionSub('공고', 'https://careers.moapay.kr/jobs/1182')).toBe('공고 · careers.moapay.kr/jobs/1182')
  })
})

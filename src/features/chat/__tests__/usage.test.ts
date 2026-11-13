import { describe, expect, it } from 'vitest'
import { ERROR_TEXT } from '../constants'
import {
  askPlaceholder,
  botHeaderMenu,
  botSpokenName,
  clearChatConfirm,
  composerPlaceholder,
  deleteBotConfirm,
  headerAction,
  isUsageExhausted,
  onboardingGreeting,
  threadGreeting,
  planRequired,
  withMaterial,
} from '../utils/usage'
import type { ChatItem } from '../types'

describe('usage exhausted copy', () => {
  it('drops 충전, an AI key, and a yearly discount', () => {
    const text = JSON.stringify(ERROR_TEXT)
    expect(text).not.toContain('충전')
    expect(text).not.toContain('AI 키를 연결해야 쓸 수 있어요')
    expect(text).not.toContain('연간 -20%')
    expect(text).not.toContain('요금제')
  })

  it('treats the credit errors as usage, and nothing else', () => {
    expect(isUsageExhausted('FEATURE_DISABLED')).toBe(true)
    expect(isUsageExhausted('INSUFFICIENT_CREDITS')).toBe(true)
    expect(isUsageExhausted('PLAN_REQUIRED')).toBe(false)
    expect(isUsageExhausted('CONSENT_REQUIRED')).toBe(false)
  })
})

describe('composerPlaceholder', () => {
  const run = (items: ChatItem[], working = false) => composerPlaceholder({ items, working: working ? { verbs: [], startedAt: 0 } : null })
  const user: ChatItem = { type: 'user', id: 'u', text: '모아페이' }
  const error = (code: string): ChatItem => ({ type: 'error', id: 'e', text: '', code })

  it('asks for a link on an empty chat and after a failed first run', () => {
    expect(run([])).toBe('공고 링크를 붙여넣어 보세요')
    expect(run([user, error('UNKNOWN')])).toBe('공고 링크를 붙여넣어 보세요')
    expect(run([user, { type: 'agentText', id: 'a', text: '좋아요' }, { type: 'tool', id: 't', action: '이력서 읽기', state: 'ok' }, error('UNKNOWN')])).toBe('공고 링크를 붙여넣어 보세요')
  })

  it('keeps the follow-up line when a later run fails in a chat that already has work', () => {
    expect(run([user, { type: 'agentText', id: 'a', text: '다 됐어요' }, { type: 'worked', id: 'w', seconds: 3 }, user, error('UNKNOWN')])).toBe('더 고칠 부분이 있으면 말해 주세요')
  })

  it('keeps the follow-up line after work and after the usage card', () => {
    expect(run([user, { type: 'agentText', id: 'a', text: '다 됐어요' }, { type: 'worked', id: 'w', seconds: 3 }])).toBe('더 고칠 부분이 있으면 말해 주세요')
    expect(run([user, error('INSUFFICIENT_CREDITS')])).toBe('더 고칠 부분이 있으면 말해 주세요')
  })

  it('counts a reopened chat, whose turns carry no worked row, as work', () => {
    expect(run([user, { type: 'agentText', id: 'a', text: '자료 분석을 마쳤어요.' }, user, error('UNKNOWN')])).toBe('더 고칠 부분이 있으면 말해 주세요')
  })

  it('lets the person talk while the agent works', () => {
    expect(run([user], true)).toBe('작업 중에도 말할 수 있어요')
  })

  it('asks the named bot on an empty chat, while working, and after work', () => {
    expect(composerPlaceholder({ items: [], working: null }, '모아페이')).toBe('모아페이 Bot에게 물어보기')
    expect(composerPlaceholder({ items: [], working: null }, 'Push Bot')).toBe('Push Bot에게 물어보기')
    expect(composerPlaceholder({ items: [user], working: { verbs: [], startedAt: 0 } }, '모아페이')).toBe('모아페이 Bot에게 물어보기')
    expect(composerPlaceholder({ items: [user], working: { verbs: [], startedAt: 0 } }, 'Push Bot')).toBe('Push Bot에게 물어보기')
    expect(composerPlaceholder({ items: [user, { type: 'agentText', id: 'a', text: '다 됐어요' }], working: null }, '모아페이')).toBe('모아페이 Bot에게 물어보기')
    const result: ChatItem = { type: 'result', id: 'r', source: 'external', checklist: [], actions: [], documentId: 'd', fileName: 'a.pdf', pageLine: 'A4 1쪽' }
    expect(composerPlaceholder({ items: [user, result, { type: 'worked', id: 'w', seconds: 3 }], working: null }, '모아페이')).toBe('모아페이 Bot에게 말하기')
    expect(composerPlaceholder({ items: [user, result], working: { verbs: [], startedAt: 0 } }, '모아페이')).toBe('모아페이 Bot에게 물어보기')
  })

  it('asks what to do with the attached material, by its kind, over the bot name', () => {
    const chat = { items: [], working: null }
    expect(composerPlaceholder(chat, '모아페이', 'file')).toBe('이 서류로 무엇을 할까요?')
    expect(composerPlaceholder(chat, '모아페이', 'document')).toBe('이 서류로 무엇을 할까요?')
    expect(composerPlaceholder(chat, '모아페이', 'posting')).toBe('이 공고로 무엇을 할까요?')
    expect(composerPlaceholder(chat, 'Push Bot', 'link')).toBe('이 링크로 무엇을 할까요?')
  })

  it('never asks to upgrade on PLAN_REQUIRED while payments are closed or the account is unknown', () => {
    expect(planRequired('FREE', true)).toBe('플랜을 올리면 쓸 수 있어요.')
    expect(planRequired('FREE', false)).toBe('지금 플랜에서는 쓸 수 없어요. 결제는 아직 준비 중이에요.')
    expect(planRequired(undefined, false)).toBe('지금 플랜에서는 쓸 수 없어요.')
  })
})

describe('bot header and onboarding', () => {
  it('names a company with Bot and leaves Push Bot alone', () => {
    expect(botSpokenName('모아페이')).toBe('모아페이 Bot')
    expect(botSpokenName('Push Bot')).toBe('Push Bot')
    expect(askPlaceholder('모아페이')).toBe('모아페이 Bot에게 물어보기')
  })

  it('follows the bot kind and refuses the other destructive row', () => {
    expect(botHeaderMenu('company').map((item) => item.label)).toEqual(['프로필 보기', '채팅에서 찾기', '삭제'])
    expect(botHeaderMenu('push').map((item) => item.label)).toEqual(['프로필 보기', '채팅에서 찾기', '대화 지우기'])
    // ChatBotHeaderMenu board: an icon on every item, the destructive one last.
    expect(botHeaderMenu('company').map((item) => item.systemImage)).toEqual(['person', 'magnifyingglass', 'trash'])
    expect(botHeaderMenu('company').map((item) => item.icon)).toEqual(['user', 'search', 'delete'])
    expect(headerAction('delete', 'company')).toBe('confirm-delete')
    expect(headerAction('delete', 'push')).toBe('noop')
    expect(headerAction('clear', 'push')).toBe('confirm-clear')
    expect(headerAction('clear', 'company')).toBe('noop')
    expect(headerAction('find', 'push')).toBe('find')
  })

  it('uses the drawn confirm and greeting lines', () => {
    expect(clearChatConfirm()).toEqual({
      title: 'Push Bot과 나눈 대화를 지울까요?',
      body: '대화 내용이 모두 지워지고 되돌릴 수 없어요. 내 서류에 저장한 파일과 자료는 그대로 남아요.',
      cancel: '취소',
      confirm: '지우기',
    })
    expect(deleteBotConfirm('모아페이').title).toBe('모아페이 Bot을 삭제할까요?')
    expect(deleteBotConfirm('모아페이').confirm).toBe('삭제')
    expect(onboardingGreeting('company', '모아페이', '백엔드 엔지니어')).toBe('안녕하세요. 모아페이 Bot이에요. 백엔드 엔지니어 공고를 기준으로 서류를 챙길게요. 무엇부터 할까요?')
    expect(onboardingGreeting('push', 'Push Bot')).toBe('안녕하세요. Push Bot이에요. 공고 찾기부터 서류, 지원까지 함께 챙길게요. 무엇부터 할까요?')
  })

  it('keeps the company greeting above the thread as the board draws it', () => {
    expect(threadGreeting('모아페이', '백엔드 엔지니어')).toBe('안녕하세요. 모아페이 Bot이에요. 이 회사 백엔드 엔지니어 공고를 기준으로 서류를 챙길게요.')
    expect(threadGreeting('모아페이')).toBe('안녕하세요. 모아페이 Bot이에요.')
  })

  it('appends material text onto one draft', () => {
    const next = withMaterial({ a: { text: '안녕', chip: '이력서' }, b: { text: '다른 Bot' } }, 'a', '공고', { text: '' })
    expect(next.a).toEqual({ text: '안녕 공고', chip: '이력서' })
    expect(next.b).toEqual({ text: '다른 Bot' })
    expect(withMaterial({}, 'b', '링크', { text: '' }).b.text).toBe('링크')
  })
})

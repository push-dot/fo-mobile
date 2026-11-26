import { describe, expect, it } from 'vitest'
import { ERROR_TEXT } from '../constants'
import {
  askPlaceholder,
  botHeaderMenu,
  botSpokenName,
  clearChatConfirm,
  composerPlaceholder,
  deleteBotConfirm,
  isDrawn,
  threadRows,
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
  it('asks the named bot in every state of the box', () => {
    expect(composerPlaceholder('모아페이')).toBe('모아페이 Bot에게 물어보기')
    expect(composerPlaceholder('Push Bot')).toBe('Push Bot에게 물어보기')
    expect(composerPlaceholder()).toBe('Bot에게 물어보기')
    expect(composerPlaceholder('모아페이', undefined, true)).toBe('작업 중에도 말할 수 있어요')
  })

  it('asks what to do with the attached material', () => {
    expect(composerPlaceholder('모아페이', 'document')).toBe('이 서류로 무엇을 할까요?')
    expect(composerPlaceholder('모아페이', 'posting')).toBe('이 공고로 무엇을 할까요?')
    expect(composerPlaceholder('모아페이', 'link')).toBe('이 링크로 무엇을 할까요?')
    expect(composerPlaceholder('모아페이', 'file')).toBe('이 서류로 무엇을 할까요?')
  })

  it('never asks to upgrade on PLAN_REQUIRED while payments are closed or the account is unknown', () => {
    expect(planRequired('FREE', true)).toBe('플랜을 올리면 쓸 수 있어요.')
    expect(planRequired('FREE', false)).toBe('지금 플랜에서는 쓸 수 없어요.')
    expect(planRequired(undefined, false)).toBe('지금 플랜에서는 쓸 수 없어요.')
  })
})

describe('bot header and onboarding', () => {
  it('names a company with Bot and leaves Push Bot alone', () => {
    expect(botSpokenName('모아페이')).toBe('모아페이 Bot')
    expect(botSpokenName('Push Bot')).toBe('Push Bot')
    expect(askPlaceholder('모아페이')).toBe('모아페이 Bot에게 물어보기')
  })

  it('follows the bot kind', () => {
    expect(botHeaderMenu('company').map((item) => item.label)).toEqual(['프로필 보기', '채팅에서 찾기', '삭제'])
    expect(botHeaderMenu('push').map((item) => item.label)).toEqual(['프로필 보기', '채팅에서 찾기', '대화 지우기'])
    expect(botHeaderMenu('company').map((item) => item.systemImage)).toEqual(['person', 'magnifyingglass', 'trash'])
    expect(botHeaderMenu('company').map((item) => item.icon)).toEqual(['user', 'search', 'delete'])
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

describe('isDrawn', () => {
  it('lists only the lines the room draws, so no hidden cell adds an 18 gap (ChatPh2, ChatPh3Boost, ChatPh3Review)', () => {
    const items: ChatItem[] = [
      { type: 'user', id: 'u', text: '네' },
      { type: 'think', id: 't', seconds: 2 },
      { type: 'tool', id: 'tool', action: '공고 읽기', state: 'ok' },
      { type: 'worked', id: 'w', seconds: 3 },
      { type: 'error', id: 'e1', text: '사용량', code: 'INSUFFICIENT_CREDITS' },
      { type: 'error', id: 'e2', text: '실패', code: 'UNKNOWN' },
      { type: 'agentText', id: 'a', text: '좋아요' },
    ]
    expect(items.filter(isDrawn).map((i) => i.id)).toEqual(['u', 'e2', 'a'])
  })

  it('lists a failed step that says why, the red line under the user line (ChatErrors)', () => {
    const failed: ChatItem = { type: 'tool', id: 'jd', action: '공고 읽기', state: 'err', error: '“자격 요건”을 읽지 못했어요 · 로그인이 필요한 영역이에요' }
    const silent: ChatItem = { type: 'tool', id: 'x', action: '공고 읽기', state: 'err' }
    expect([failed, silent].filter(isDrawn).map((i) => i.id)).toEqual(['jd'])
  })
})

describe('threadRows', () => {
  const user: ChatItem = { type: 'user', id: 'u', text: '네, 써 주세요' }
  const todo: ChatItem = { type: 'surface', id: 'todo', kind: 'todo', messages: [] }
  const tool: ChatItem = { type: 'tool', id: 'tool', action: '이력서 쓰기', state: 'run' }
  const paper: ChatItem = { type: 'surface', id: 'p', kind: 'paper', messages: [] }
  const ids = (rows: { id: string }[]) => rows.map((r) => r.id)

  it('puts the running line under the draft being written (ChatPh3)', () => {
    expect(ids(threadRows([user, todo, tool, paper], true))).toEqual(['u', 'todo', 'p', 'running'])
  })

  it('draws the line under the last line when no draft is being written (ChatBotStatusWork, Think, Queue)', () => {
    expect(ids(threadRows([user], true))).toEqual(['u', 'running'])
    expect(ids(threadRows([user, todo], true))).toEqual(['u', 'todo', 'running'])
    expect(ids(threadRows([user, todo, tool], true))).toEqual(['u', 'todo', 'running'])
  })

  it('draws no line when the run is not working', () => {
    expect(ids(threadRows([user], false))).toEqual(['u'])
  })

  it('draws a finished draft as it is, with no line', () => {
    expect(ids(threadRows([user, todo, paper], false))).toEqual(['u', 'todo', 'p'])
  })
})

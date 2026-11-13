import { describe, expect, it } from 'vitest'
import type { Bot, BotId, CompanyBot } from '../types'
import { companyMenu, dropDeleted, heroLabel, homeRowLabel, rowMotion, searchSections, splitHome } from './home-rows'

const company = (id: string, name: string, at: string): CompanyBot => ({
  id: id as BotId,
  kind: 'company',
  name,
  color: 'teal',
  postingId: null,
  muted: false,
  revision: 1,
  lastActivityAt: new Date(at),
  lastMessage: null,
  unread: false,
  activity: { phase: 'idle' },
  outcome: null,
})

const push = (at: string): Bot => ({
  id: 'push' as BotId,
  kind: 'push',
  name: 'Push Bot',
  muted: false,
  revision: 1,
  lastActivityAt: new Date(at),
  lastMessage: null,
  unread: true,
  activity: { phase: 'idle' },
  outcome: null,
})

describe('splitHome', () => {
  it('keeps the server order and does not sort by time', () => {
    const bots = [push('2026-11-01'), company('late', '나중', '2026-11-09'), company('early', '먼저', '2026-10-01')]
    const home = splitHome([...bots].reverse())
    expect(home.push?.kind).toBe('push')
    expect(home.companies.map((b) => b.name)).toEqual(['먼저', '나중'])
  })
})

describe('homeRowLabel', () => {
  it('speaks the company row the way the board does, including the line and the time', () => {
    expect(homeRowLabel({ name: '모아페이', mascot: 'help', line: '이 변경을 이력서에 반영할까요?', time: '10분 전' })).toBe(
      '모아페이 Bot, 확인 필요, 이 변경을 이력서에 반영할까요?, 10분 전',
    )
  })

  it('splits 완료 and 안 읽음 into two spoken parts', () => {
    expect(homeRowLabel({ name: '누리클라우드', mascot: 'done', line: '자기소개서 초안 v2를 만들었어요', time: '어제' })).toBe(
      '누리클라우드 Bot, 완료, 안 읽음, 자기소개서 초안 v2를 만들었어요, 어제',
    )
  })
})

describe('heroLabel', () => {
  it('adds the unread clause only when Push Bot has new activity', () => {
    expect(heroLabel(true)).toBe('Push Bot 대화 열기, 새 활동 있음')
    expect(heroLabel(false)).toBe('Push Bot 대화 열기')
  })
})

describe('companyMenu', () => {
  it('lists the board actions and never offers delete on Push Bot', () => {
    expect(companyMenu('company').map((a) => a.key)).toEqual(['profile', 'find', 'read', 'mute', 'delete'])
    expect(companyMenu('company').map((a) => a.label)).toEqual(['Bot 프로필 보기', '채팅에서 찾기', '읽음으로 표시', '알림 끄기', '삭제'])
    expect(companyMenu('push')).toEqual([])
  })

  it('keeps the board mute phrase when the bot is already muted', () => {
    expect(companyMenu('company', true).find((a) => a.key === 'mute')?.label).toBe('알림 끄기')
  })
})

describe('dropDeleted', () => {
  it('removes that row and forgets its chat', () => {
    const forgotten: string[] = []
    const next = dropDeleted([company('a', '모아페이', '2026-11-01'), company('b', '파도AI', '2026-11-02')], 'a', (id) => forgotten.push(id))
    expect(next.map((b) => b.id)).toEqual(['b'])
    expect(forgotten).toEqual(['a'])
  })
})

describe('rowMotion', () => {
  it('holds a frame while off-screen and staggers bots that are moving', () => {
    expect(rowMotion('think', 2, true)).toEqual({ mode: 'frame3' })
    expect(rowMotion('idle', 0, false)).toEqual({ mode: 'still' })
    expect(rowMotion('work', 3, false)).toEqual({ mode: 'animate', delayMs: 480 })
  })
})

describe('searchSections', () => {
  it('names a section only when that side has hits', () => {
    expect(searchSections(1, 2)).toEqual(['Bot 1', '대화 2'])
    expect(searchSections(0, 0)).toEqual([])
  })
})

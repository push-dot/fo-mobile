import type { Bot, MascotState } from '../types'

const SPOKEN = {
  help: '확인 필요',
  done: '완료, 안 읽음',
  work: '작업 중',
  think: '생각 중',
  idle: '대기',
} as const

const MENU = [
  { key: 'profile', label: 'Bot 프로필 보기', destructive: false },
  { key: 'find', label: '채팅에서 찾기', destructive: false },
  { key: 'read', label: '읽음으로 표시', destructive: false },
  { key: 'mute', label: '알림 끄기', destructive: false },
  { key: 'delete', label: '삭제', destructive: true },
] as const

const STAGGER_MS = 160

export type HomeMenuKey = (typeof MENU)[number]['key']

export type HomeMotion = { mode: 'still' } | { mode: 'frame3' } | { mode: 'animate'; delayMs: number }

export const splitHome = (bots: readonly Bot[]) => ({
  push: bots.find((bot) => bot.kind === 'push'),
  companies: bots.filter((bot) => bot.kind !== 'push'),
})

/** `spoken` replaces the mascot's state word; '' says none. */
export const homeRowLabel = (row: { name: string; mascot: MascotState; line: string; time: string; spoken?: string }) =>
  [`${row.name} Bot`, row.spoken ?? SPOKEN[row.mascot], row.line, row.time].filter((part) => part !== '').join(', ')

export const heroLabel = (unread: boolean) => (unread ? 'Push Bot 대화 열기, 새 활동 있음' : 'Push Bot 대화 열기')

export const accountLabel = (name: string, plan: string | undefined) => (plan ? `계정 · ${name}, ${plan}` : `계정 · ${name}`)

export const companyMenu = (kind: 'push' | 'company', muted = false) =>
  kind === 'push' ? [] : MENU.map((item) => ({ ...item, label: item.key === 'mute' && muted ? '알림 끄기' : item.label }))

export const dropDeleted = <T extends { id: string }>(rows: readonly T[], id: string, forget: (id: string) => void) => {
  forget(id)
  return rows.filter((row) => row.id !== id)
}

export const rowMotion = (mascot: MascotState, index: number, held: boolean): HomeMotion => {
  if (held) return { mode: 'frame3' }
  if (mascot === 'idle') return { mode: 'still' }
  return { mode: 'animate', delayMs: index * STAGGER_MS }
}

export const searchSections = (botCount: number, messageCount: number) =>
  [botCount > 0 ? `Bot ${botCount}` : '', messageCount > 0 ? `대화 ${messageCount}` : ''].filter((title) => title !== '')

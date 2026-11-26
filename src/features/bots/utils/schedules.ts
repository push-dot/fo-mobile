import { ApiError } from '@push/api-client'
import type { ScheduleCadence } from '../types'

export const SCHEDULES_ROW = '예약한 일'
export const SCHEDULES_EMPTY_TITLE = '아직 예약한 일이 없어요'
export const SCHEDULES_EMPTY_BODY = '정한 시간마다 Bot이 알아서 일하고 끝나면 알려 드려요.'
export const SCHEDULES_ERROR = '예약한 일을 불러오지 못했어요.'
export const SCHEDULE_ADD = '새로 예약하기'
export const SCHEDULE_SAVE = '예약하기'
export const SCHEDULE_DELETE = '삭제'
export const SCHEDULE_NEW_TITLE = '새로 예약하기'
export const SCHEDULE_PROMPT_LABEL = '할 일'
export const SCHEDULE_PROMPT_PLACEHOLDER = '예: 새 공고 3개 찾아 줘'
export const SCHEDULE_WHEN_LABEL = '언제'
export const SCHEDULE_HOUR_LABEL = '시간'
export const SCHEDULE_ASK_NOTE = '무언가를 바꾸기 전에는 꼭 먼저 물어봐요.'
export const SCHEDULE_TOGGLE_FAILED = '바꾸지 못했어요. 잠시 뒤에 다시 해 주세요.'
export const SCHEDULE_DELETE_FAILED = '삭제하지 못했어요. 잠시 뒤에 다시 해 주세요.'
export const SCHEDULE_PROMPT_MAX = 500
export const SCHEDULE_LIMIT_DEFAULT = 5

export const SCHEDULE_PRESETS = ['새 공고 3개 찾아 줘', '북마크한 공고 중 마감 임박한 공고 정리해 줘', '지원 현황 정리해 줘'] as const

export const CADENCE_ITEMS: { key: ScheduleCadence; label: string }[] = [
  { key: 'DAILY', label: '매일' },
  { key: 'WEEKDAYS', label: '평일' },
  { key: 'WEEKLY', label: '매주' },
]

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const

export const WEEKDAY_ITEMS = [1, 2, 3, 4, 5, 6, 0].map((day) => ({ key: String(day), label: WEEKDAY_NAMES[day]! }))

export const hourLabel = (hour: number) => `${hour < 12 ? '오전' : '오후'} ${hour % 12 === 0 ? 12 : hour % 12}시`

export const HOUR_ITEMS = Array.from({ length: 24 }, (_, hour) => ({ key: String(hour), label: hourLabel(hour) }))

export const scheduleTiming = ({ cadence, hour, weekday }: { cadence: ScheduleCadence; hour: number; weekday: number | null }) => {
  if (cadence === 'WEEKLY') return `매주 ${WEEKDAY_NAMES[weekday ?? 1]}요일 ${hourLabel(hour)}`
  return `${cadence === 'DAILY' ? '매일' : '평일'} ${hourLabel(hour)}`
}

export const scheduleErrorLine = (code: string | null) => {
  if (code === null) return null
  return code === 'BOT_BUSY' ? 'Bot이 다른 일을 하고 있어서 이번에는 건너뛰었어요' : '지난번에 실행하지 못했어요'
}

export const scheduleSaveError = (e: unknown) => {
  const code = e instanceof ApiError ? e.code : undefined
  const limit = e instanceof ApiError ? e.details?.limit : undefined
  if (code === 'SCHEDULE_LIMIT') return `예약은 ${Number.isInteger(limit) ? limit : SCHEDULE_LIMIT_DEFAULT}개까지 만들 수 있어요`
  if (code === 'CONSENT_REQUIRED') return 'Bot을 쓰려면 동의가 필요해요'
  return '예약하지 못했어요. 잠시 뒤에 다시 해 주세요.'
}

export const schedulesValue = (count: number | null) => (count === null ? '' : `${count}개`)

export type SchedulesView = 'loading' | 'error' | 'empty' | 'list'

export const schedulesView = (q: { isLoading: boolean; isError: boolean; count: number | null }): SchedulesView => {
  if (q.count !== null && q.count > 0) return 'list'
  if (q.isError) return 'error'
  if (q.count === 0) return 'empty'
  return 'loading'
}

export const schedulesTitle = (count: number) => (count === 0 ? SCHEDULES_ROW : `${SCHEDULES_ROW} ${count}`)

export const scheduleBody = (input: { prompt: string; cadence: ScheduleCadence; hour: number; weekday: number }) => {
  const prompt = input.prompt.trim()
  if (prompt.length === 0 || prompt.length > SCHEDULE_PROMPT_MAX) return null
  return { prompt, cadence: input.cadence, hour: input.hour, ...(input.cadence === 'WEEKLY' ? { weekday: input.weekday } : {}) }
}

import { describe, expect, it } from 'vitest'
import { ApiError } from '@push/api-client'
import { HOUR_ITEMS, WEEKDAY_ITEMS, hourLabel, scheduleBody, scheduleErrorLine, scheduleSaveError, scheduleTiming, schedulesTitle, schedulesValue, schedulesView } from './schedules'

describe('schedule timing line', () => {
  it('reads the hour in Korean twelve-hour time', () => {
    expect([0, 9, 12, 18, 23].map(hourLabel)).toEqual(['오전 12시', '오전 9시', '오후 12시', '오후 6시', '오후 11시'])
    expect(HOUR_ITEMS).toHaveLength(24)
  })

  it('names the cadence and, for a weekly run, the weekday', () => {
    expect(scheduleTiming({ cadence: 'DAILY', hour: 9, weekday: null })).toBe('매일 오전 9시')
    expect(scheduleTiming({ cadence: 'WEEKDAYS', hour: 18, weekday: null })).toBe('평일 오후 6시')
    expect(scheduleTiming({ cadence: 'WEEKLY', hour: 9, weekday: 1 })).toBe('매주 월요일 오전 9시')
    expect(scheduleTiming({ cadence: 'WEEKLY', hour: 21, weekday: 0 })).toBe('매주 일요일 오후 9시')
  })

  it('starts the weekday picker on Monday', () => {
    expect(WEEKDAY_ITEMS.map((w) => w.label).join('')).toBe('월화수목금토일')
    expect(WEEKDAY_ITEMS[6]?.key).toBe('0')
  })
})

describe('schedule errors', () => {
  it('explains a skipped run when the bot was busy, and stays generic otherwise', () => {
    expect(scheduleErrorLine(null)).toBeNull()
    expect(scheduleErrorLine('BOT_BUSY')).toBe('Bot이 다른 일을 하고 있어서 이번에는 건너뛰었어요')
    expect(scheduleErrorLine('INSUFFICIENT_CREDITS')).toBe('지난번에 실행하지 못했어요')
  })

  it('names the limit when saving fails on it', () => {
    expect(scheduleSaveError(new ApiError('limit', 'SCHEDULE_LIMIT', 403, { limit: 5 }))).toBe('예약은 5개까지 만들 수 있어요')
    expect(scheduleSaveError(new ApiError('limit', 'SCHEDULE_LIMIT', 403))).toBe('예약은 5개까지 만들 수 있어요')
    expect(scheduleSaveError(new ApiError('consent', 'CONSENT_REQUIRED', 403))).toBe('Bot을 쓰려면 동의가 필요해요')
    expect(scheduleSaveError(new Error('offline'))).toBe('예약하지 못했어요. 잠시 뒤에 다시 해 주세요.')
  })
})

describe('schedule rows and body', () => {
  it('counts schedules on the profile row and the sheet title', () => {
    expect(schedulesValue(2)).toBe('2개')
    expect(schedulesValue(null)).toBe('')
    expect(schedulesTitle(0)).toBe('예약한 일')
    expect(schedulesTitle(3)).toBe('예약한 일 3')
  })

  it('trims the prompt, refuses a blank or long one, and sends the weekday only for a weekly run', () => {
    expect(scheduleBody({ prompt: '  지원 현황 정리해 줘 ', cadence: 'DAILY', hour: 9, weekday: 1 })).toEqual({ prompt: '지원 현황 정리해 줘', cadence: 'DAILY', hour: 9 })
    expect(scheduleBody({ prompt: 'a', cadence: 'WEEKLY', hour: 9, weekday: 3 })).toEqual({ prompt: 'a', cadence: 'WEEKLY', hour: 9, weekday: 3 })
    expect(scheduleBody({ prompt: '   ', cadence: 'DAILY', hour: 9, weekday: 1 })).toBeNull()
    expect(scheduleBody({ prompt: 'a'.repeat(501), cadence: 'DAILY', hour: 9, weekday: 1 })).toBeNull()
  })
})

describe('schedules sheet state', () => {
  it('shows loading until the list arrives, the retry note on an error, and the list over a later refetch error', () => {
    expect(schedulesView({ isLoading: true, isError: false, count: null })).toBe('loading')
    expect(schedulesView({ isLoading: false, isError: true, count: null })).toBe('error')
    expect(schedulesView({ isLoading: false, isError: false, count: 0 })).toBe('empty')
    expect(schedulesView({ isLoading: false, isError: false, count: 2 })).toBe('list')
    expect(schedulesView({ isLoading: false, isError: true, count: 2 })).toBe('list')
  })
})

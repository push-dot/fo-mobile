import { describe, expect, it } from 'vitest'
import { clampMonth, formatDay, formatMonth, formatTime, fromPickerUtc, startOfMonth, toPickerUtc, withTime, yearsBetween } from './picker-date'

describe('picker date labels', () => {
  it('formats a month the way 경력 fields show it', () => {
    expect(formatMonth(new Date(2022, 2, 17))).toBe('2022년 3월')
  })

  it('formats a day with the weekday', () => {
    expect(formatDay(new Date(2026, 9, 23))).toBe('10월 23일 (금)')
  })

  it.each([
    [0, 5, '오전 12:05'],
    [9, 0, '오전 9:00'],
    [12, 30, '오후 12:30'],
    [14, 0, '오후 2:00'],
  ])('formats %i:%i as %s', (h, m, label) => {
    expect(formatTime(new Date(2026, 0, 1, h, m))).toBe(label)
  })
})

describe('picker date math', () => {
  it('drops the day and time for month-only values', () => {
    expect(startOfMonth(new Date(2022, 2, 17, 13, 45))).toEqual(new Date(2022, 2, 1))
  })

  it('keeps the date and takes the picked hour and minute', () => {
    expect(withTime(new Date(2026, 9, 23, 9, 0), new Date(2000, 0, 1, 14, 30))).toEqual(new Date(2026, 9, 23, 14, 30))
  })

  it('sends Material the local calendar day as UTC midnight', () => {
    expect(toPickerUtc(new Date(2026, 9, 23, 0, 30))).toBe('2026-10-23T00:00:00.000Z')
  })

  it('reads the Material UTC day back as a local date', () => {
    expect(fromPickerUtc(new Date(Date.UTC(2026, 9, 23)))).toEqual(new Date(2026, 9, 23))
  })
})

describe('month picker range', () => {
  it('lists years newest first between the bounds', () => {
    expect(yearsBetween(new Date(2020, 5, 1), new Date(2023, 0, 1))).toEqual([2023, 2022, 2021, 2020])
  })

  it('defaults to 1970 up to this year', () => {
    const years = yearsBetween()
    expect(years[0]).toBe(new Date().getFullYear())
    expect(years.at(-1)).toBe(1970)
  })

  it('pulls a month outside the bounds back to the nearest allowed month', () => {
    const min = new Date(2020, 3, 15)
    const max = new Date(2023, 5, 10)
    expect(clampMonth(new Date(2019, 0, 1), min, max)).toEqual(new Date(2020, 3, 1))
    expect(clampMonth(new Date(2023, 11, 1), min, max)).toEqual(new Date(2023, 5, 1))
    expect(clampMonth(new Date(2021, 1, 1), min, max)).toEqual(new Date(2021, 1, 1))
    expect(clampMonth(new Date(2021, 1, 1))).toEqual(new Date(2021, 1, 1))
  })
})

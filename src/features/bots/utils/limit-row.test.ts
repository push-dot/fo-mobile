import { describe, expect, it } from 'vitest'
import { limitRowMeta } from './limit-row'

describe('limit row meta', () => {
  it('joins the posting title and the time with a middle dot', () => {
    expect(limitRowMeta('백엔드 엔지니어', '어제')).toBe('백엔드 엔지니어 · 어제')
  })

  it('shows the time alone when the posting is gone', () => {
    expect(limitRowMeta(null, '10월 28일')).toBe('10월 28일')
    expect(limitRowMeta(undefined, '어제')).toBe('어제')
    expect(limitRowMeta('', '어제')).toBe('어제')
  })
})

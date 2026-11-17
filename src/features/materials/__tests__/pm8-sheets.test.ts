import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { PM8_MDET_HEAD, PM8_MDET_TITLE, PM8_SLIM_ACTION } from '@/shared/components/pm8'

const read = (f: string) => readFileSync(path.join(import.meta.dirname, f), 'utf8')

describe('materials sheets on the .pm8 boards (the Bot pick is a regular sheet over the 자료 modal, RULINGS 53)', () => {
  it('draws the material title 22/30 bold on a 52 high head and the buttons 52 high with a 26 radius', () => {
    expect(PM8_MDET_TITLE).toEqual({ fontSize: 22, lineHeight: 30, weight: '700' })
    expect(PM8_MDET_HEAD).toEqual({ minHeight: 52, paddingTop: 4, paddingBottom: 8 })
    expect(PM8_SLIM_ACTION).toEqual({ minHeight: 52, borderRadius: 26 })
  })

  it.each(['../components/material-detail-page.tsx', '../components/link-add-page.tsx', '../components/send-bot-page.tsx'])('%s lays out through the shared PM8 sheet geometry', (file) => {
    expect(read(file)).toContain('topGap={PM8.topGap}')
  })

  it('the Bot pick title takes its weight, size and line height from the board constants', () => {
    const src = read('../components/send-bot-page.tsx')
    expect(src).toContain('weight={PM8_MDET_TITLE.weight}')
    expect(src).toContain('fontSize: PM8_MDET_TITLE.fontSize')
    expect(src).toContain('lineHeight: PM8_MDET_TITLE.lineHeight')
    expect(src).toContain('...PM8_MDET_HEAD')
  })

  it('the detail page buttons spread the shared slim action', () => {
    expect(read('../components/material-detail-page.tsx')).toContain('...PM8_SLIM_ACTION')
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SLIM_HEIGHT } from '@/shared/components/segmented-control.compact'
import { QUICK_STARTS } from '../constants'

const read = (rel: string) => readFileSync(path.join(import.meta.dirname, '../../..', rel), 'utf8')

describe('quick-start sheets keep the heights their boards draw', () => {
  it('draws the sheet tabs 40 high (QsGap, QsFit, QsStatus, QsCoffee), not the 44 of the page tabs', () => {
    expect(SLIM_HEIGHT).toBe(40)
    expect(read('features/chat/components/quick-start-sheet.tsx')).toContain('slim={!all}')
    expect(read('shared/components/segmented-control.ios.tsx')).toContain("compact ? 'compact' : slim ? 'slim' : 'regular'")
  })

  it('draws the QsExp free-input field 54 high and leaves QsPost on the 56 default', () => {
    expect(QUICK_STARTS.find((q) => q.key === 'exp')?.customHeight).toBe(54)
    expect(QUICK_STARTS.find((q) => q.key === 'post')?.customHeight).toBeUndefined()
  })

  it('lays the all-topics page out as .compose: 16 above a 44 header, 20 beside it, the CTA 8 above the home inset', () => {
    expect(read('features/chat/components/page-modal.tsx')).toContain('const COMPOSE = { top: 16, header: 44, side: 20, bottom: 8 }')
    const sheet = read('features/chat/components/quick-start-sheet.tsx')
    expect(sheet).toContain('<View style={{ gap: spacing[4], paddingHorizontal: spacing[5] }}>{content}</View>')
    expect(sheet).toContain('minHeight={all ? ALL_FIELD_HEIGHT : qs.customHeight}')
  })
})

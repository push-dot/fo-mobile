import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (rel: string) => readFileSync(path.join(import.meta.dirname, '../../..', rel), 'utf8')

describe('sheet pages follow their boards', () => {
  it('paints the QsPostAll and QsReplyAll page white, the review on the system sheet fill with a 56 fade', () => {
    expect(read('features/chat/components/quick-start-sheet.tsx')).toMatch(/<PageModal[^>]*\bsheet white\b/)
    const review = read('screens/chat/review-screen.tsx')
    expect(review).not.toMatch(/<PageModal[^>]*\bwhite\b/)
    expect(review).toContain('fadeAbove={56}')
  })

  it('fits the five link kinds on one row: 12 padded chips, 6 apart', () => {
    const page = read('features/materials/components/link-add-page.tsx')
    expect(page).toContain('KIND_GAP = 6')
    expect(page).toContain('padding: spacing[3], height: 36')
  })

  it('spaces the quick-start cards and lists as QsPost, QsPostAll and QsGap draw them', () => {
    const sheet = read('features/chat/components/quick-start-sheet.tsx')
    expect(sheet).toContain('gap={all ? spacing[2] : spacing[3]}')
    expect(sheet).toContain('flat={all}')
    expect(sheet).toContain('moreGap={spacing[3]}')
    expect(sheet).toContain("moreGap={qs.layout === 'reply' ? 0 : spacing[3]}")
    expect(sheet).toContain('paddingHorizontal: theme.spacing[5]')
    expect(sheet).toContain('<Button label={action.label} disabled={action.disabled} onPress={action.onPress} />')
    expect(sheet).toContain('qs.listLabel && (docField ||')
    const list = read('shared/components/recent-list.tsx')
    expect(list).toContain('gap = 0, moreGap = 0')
    expect(list).toContain('style={styles.gap(moreGap)}')
  })
})

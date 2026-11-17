import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (f: string) => readFileSync(path.join(import.meta.dirname, f), 'utf8')

describe('v489 boards', () => {
  it('draws a closing line summary as the dotted list (ul.mdul), not grey text with a bullet character', () => {
    const bot = read('../components/entries/bot.tsx')
    expect(bot).toContain('<BulletList items={item.bullets} markId={item.id} />')
    expect(bot).not.toContain('`• ${line}`')
  })

  it('draws the choice rows through pm8Row and the review card 4 under its header (.pm-b)', () => {
    expect(read('../../../screens/choice/choice-sheet-screen.tsx')).toContain('...pm8Row(mark)')
    expect(read('../../../screens/chat/review-screen.tsx')).toMatch(/marginHorizontal: spacing\[4\], marginTop: spacing\[1\], paddingTop: spacing\[5\]/)
  })
})

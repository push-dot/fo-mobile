import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (f: string) => readFileSync(path.join(import.meta.dirname, '../components/entries', f), 'utf8')

describe('XL chat text (ChatBotHeaderXL)', () => {
  it('tracks the 21 pt lines at -0.015em, the board render', () => {
    expect(readFileSync(path.join(import.meta.dirname, '../../../shared/components/xl-chrome.ts'), 'utf8')).toContain('XL_CHAT_TRACKING = -0.315')
    expect(read('bot.tsx')).toContain('letterSpacing: XL_CHAT_TRACKING')
    expect(read('user.tsx')).toContain('letterSpacing: XL_CHAT_TRACKING')
  })

  it('keeps the 출처 line at 14 pt instead of scaling it, so it stays on one line', () => {
    const sources = read('bot.tsx').split('item.sources?.length')[1]!.split('</Bubble>')[0]!
    expect(sources.match(/allowFontScaling=\{!xl\}/g)).toHaveLength(2)
  })
})

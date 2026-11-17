import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (f: string) => readFileSync(path.join(import.meta.dirname, f), 'utf8')

describe('materials sheets on the .pm8 boards (the Bot pick is a regular sheet over the 자료 modal, RULINGS 53)', () => {
  it.each(['../components/material-detail-page.tsx', '../components/link-add-page.tsx', '../components/send-bot-page.tsx'])('%s lays out through the shared PM8 sheet geometry', (file) => {
    expect(read(file)).toContain('topGap={PM8.topGap}')
  })
})

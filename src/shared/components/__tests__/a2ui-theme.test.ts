import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { palette } from '../../../theme/tokens'
import { A2UI_THEME_COLORS, a2uiThemeJson } from '../a2ui-theme'

const root = new URL('../../../../modules/push-a2ui/', import.meta.url)
const sources = (dir: string) => readdirSync(new URL(dir, root)).map((f) => readFileSync(new URL(`${dir}${f}`, root), 'utf8')).join('\n')
const native = sources('ios/') + sources('android/src/main/java/expo/modules/pusha2ui/')
const read = (pattern: RegExp) => new Set([...native.matchAll(pattern)].map((m) => m[1]!))

describe('A2UI theme', () => {
  it('sends every colour token the native components read', () => {
    const missing = [...read(/\.color\("(\w+)"\)/g)].filter((k) => !(A2UI_THEME_COLORS as readonly string[]).includes(k))
    expect(missing).toEqual([])
  })

  it('sends every radius the native components read', () => {
    const sent = Object.keys(JSON.parse(a2uiThemeJson(palette.light, 'ios')).radius as object)
    expect([...read(/\.r\("(\w+)"/g)].filter((k) => !sent.includes(k))).toEqual([])
  })

  it('fails in development when the scheme lacks a token', () => {
    expect(() => a2uiThemeJson({ ...palette.light, acSoft: '' }, 'android')).toThrow('acSoft')
  })
})

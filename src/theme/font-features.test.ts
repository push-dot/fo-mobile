import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = join(__dirname, '../../assets/fonts')
const FACES = ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold']

const gsubFeatureLookups = (file: string) => {
  const b = readFileSync(file)
  const tables = b.readUInt16BE(4)
  let gsub = -1
  for (let i = 0; i < tables; i++) if (b.toString('latin1', 12 + i * 16, 16 + i * 16) === 'GSUB') gsub = b.readUInt32BE(20 + i * 16)
  const list = gsub + b.readUInt16BE(gsub + 6)
  const count = b.readUInt16BE(list)
  const out: Record<string, number> = {}
  for (let i = 0; i < count; i++) {
    const tag = b.toString('latin1', list + 2 + i * 6, list + 6 + i * 6)
    const feature = list + b.readUInt16BE(list + 6 + i * 6)
    out[tag] = (out[tag] ?? 0) + b.readUInt16BE(feature + 2)
  }
  return out
}

describe('bundled Noto Sans KR', () => {
  it.each(FACES)('%s has no contextual-alternate or locale space lookups', (face) => {
    const features = gsubFeatureLookups(join(dir, `NotoSansKR-${face}.ttf`))
    expect(features.calt).toBe(0)
    expect(features.locl).toBe(0)
  })
})

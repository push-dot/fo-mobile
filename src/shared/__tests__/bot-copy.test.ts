import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OLD, SHORT, leftovers, rename, renameCopy } from '../../../scripts/bot-copy.mjs'

describe('Bot copy', () => {
  it.each([
    [`${OLD}로 맞추기`, 'Bot으로 맞추기'],
    [`${OLD}가 어떻게 실행할까요?`, 'Bot이 어떻게 실행할까요?'],
    [`${OLD}를 쓰려면 켜 두어야 해요`, 'Bot을 쓰려면 켜 두어야 해요'],
    [`${OLD}는 쉬는 중`, 'Bot은 쉬는 중'],
    [`${OLD}와 대화`, 'Bot과 대화'],
    [`${OLD} 작업 완료`, 'Bot 작업 완료'],
    [`${OLD}에서 쓰기`, 'Bot에서 쓰기'],
    [`${OLD}가 읽고 ${OLD}로 고쳐요`, 'Bot이 읽고 Bot으로 고쳐요'],
    [`${SHORT}이 어떻게 실행할까요?`, 'Bot이 어떻게 실행할까요?'],
    [`${SHORT}으로 고치기`, 'Bot으로 고치기'],
    ['로봇 청소기', '로봇 청소기'],
    ["/봇$/ // bot-copy: keep", "/봇$/ // bot-copy: keep"],
    ['AI와 함께 하는 커리어', 'AI와 함께 하는 커리어'],
  ])('%s reads %s', (before, after) => {
    expect(renameCopy(before)).toBe(after)
  })

  it('rewrites src once and then finds nothing to do', () => {
    const app = mkdtempSync(join(tmpdir(), 'bot-copy-'))
    try {
      mkdirSync(join(app, 'src/features'), { recursive: true })
      writeFileSync(join(app, 'src/features/copy.ts'), `export const A = '${OLD}로 고치기'\nexport const B = '원본'\n`)

      expect(leftovers(app)).toEqual([
        `src/features/copy.ts:1: export const A = '${OLD}로 고치기'`,
      ])
      expect(rename(app)).toEqual(['src/features/copy.ts'])
      expect(readFileSync(join(app, 'src/features/copy.ts'), 'utf8')).toBe(
        "export const A = 'Bot으로 고치기'\nexport const B = '원본'\n",
      )
      expect(leftovers(app)).toEqual([])
      expect(rename(app)).toEqual([])
    } finally {
      rmSync(app, { recursive: true, force: true })
    }
  })

  it('is gone from the app source', () => {
    expect(leftovers()).toEqual([])
  })
})

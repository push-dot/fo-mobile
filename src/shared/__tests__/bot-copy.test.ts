import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OLD, leftovers, rename, renameCopy } from '../../../scripts/bot-copy.mjs'

describe('봇 copy', () => {
  it.each([
    [`${OLD}로 맞추기`, '봇으로 맞추기'],
    [`${OLD}가 어떻게 실행할까요?`, '봇이 어떻게 실행할까요?'],
    [`${OLD}를 쓰려면 켜 두어야 해요`, '봇을 쓰려면 켜 두어야 해요'],
    [`${OLD}는 쉬는 중`, '봇은 쉬는 중'],
    [`${OLD}와 대화`, '봇과 대화'],
    [`${OLD} 작업 완료`, '봇 작업 완료'],
    [`${OLD}에서 쓰기`, '봇에서 쓰기'],
    [`Push ${OLD}로 면접 준비`, 'Push 봇으로 면접 준비'],
    [`${OLD}가 읽고 ${OLD}로 고쳐요`, '봇이 읽고 봇으로 고쳐요'],
    ['AI와 함께 하는 커리어', 'AI와 함께 하는 커리어'],
  ])('%s reads %s', (before, after) => {
    expect(renameCopy(before)).toBe(after)
  })

  it('rewrites src and .maestro once and then finds nothing to do', () => {
    const app = mkdtempSync(join(tmpdir(), 'bot-copy-'))
    try {
      mkdirSync(join(app, 'src/features'), { recursive: true })
      mkdirSync(join(app, '.maestro'))
      writeFileSync(join(app, 'src/features/copy.ts'), `export const A = '${OLD}로 고치기'\nexport const B = '원본'\n`)
      writeFileSync(join(app, '.maestro/flow.yaml'), `- tapOn: "${OLD}"\n`)

      expect(leftovers(app)).toEqual([
        `src/features/copy.ts:1: export const A = '${OLD}로 고치기'`,
        `.maestro/flow.yaml:1: - tapOn: "${OLD}"`,
      ])
      expect(rename(app).sort()).toEqual(['.maestro/flow.yaml', 'src/features/copy.ts'])
      expect(readFileSync(join(app, 'src/features/copy.ts'), 'utf8')).toBe(
        "export const A = '봇으로 고치기'\nexport const B = '원본'\n",
      )
      expect(leftovers(app)).toEqual([])
      expect(rename(app)).toEqual([])
    } finally {
      rmSync(app, { recursive: true, force: true })
    }
  })

  it('is gone from the app source and the Maestro flows', () => {
    expect(leftovers()).toEqual([])
  })
})

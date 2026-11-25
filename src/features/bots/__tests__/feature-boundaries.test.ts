import { join } from 'node:path'
import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

let eslint: ESLint

beforeAll(async () => {
  eslint = new ESLint({ cwd: join(__dirname, '../../../..'), overrideConfig: { rules: { 'import/no-cycle': 'off' } } })
  await eslint.lintText('export {}\n', { filePath: 'src/screens/bots/x.tsx' })
}, 60_000)

const deepImports = async (file: string, spec: string) => {
  const [result] = await eslint.lintText(`export * from '${spec}'\n`, { filePath: file })
  return (result?.messages ?? []).filter((m) => m.ruleId === 'coding-hooks/feature-boundaries').length
}

describe('features are imported through their index', () => {
  it.each([
    ['src/screens/bots/x.tsx', '@/features/bots/utils/paths'],
    ['src/screens/bots/x.tsx', '../../features/materials/api/hooks'],
    ['src/features/materials/api/x.ts', '../../bots/types'],
    ['src/screens/home/x.tsx', '@/features/chat/types'],
    ['src/mock/x.ts', '../features/bots/api/hooks'],
    ['src/mock/__tests__/x.test.ts', '@/features/materials/api/schemas'],
    ['src/screens/chat/conversation-screen.tsx', '@/features/bots/types'],
    ['src/screens/chat/conversation-screen.tsx', '@/features/chat/utils/follow-scroll'],
    ['src/screens/my/x.tsx', '@/features/my/utils/time-ago'],
    ['src/features/chat/api/x.ts', '@/features/chat/types'],
  ])('rejects %s importing %s', async (file, spec) => {
    expect(await deepImports(file, spec)).toBe(1)
  })

  it.each([
    ['src/screens/bots/x.tsx', '@/features/bots'],
    ['src/screens/bots/x.tsx', '@/features/materials/index'],
    ['src/features/bots/api/x.ts', '../utils/paths'],
    ['src/mock/x.ts', '../features/bots/constants'],
    ['src/mock/x.ts', '../features/chat/utils/links'],
    ['src/mock/__tests__/x.test.ts', '@/features/materials/utils/material-row'],
    ['src/features/my/x.test.ts', '@/features/chat/utils/links'],
  ])('allows %s importing %s', async (file, spec) => {
    expect(await deepImports(file, spec)).toBe(0)
  })
})

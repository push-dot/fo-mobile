import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const src = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8')

const files = [
  'features/chat/components/items.tsx',
  'features/chat/components/docs-modal.tsx',
  'features/chat/components/composer-area.tsx',
  'features/chat/components/quick-start-sheet.tsx',
  'features/chat/components/approval-panel.tsx',
  'features/chat/components/links-modal.tsx',
  'features/my/components/docs-tab.tsx',
  'features/my/components/index.ts',
  'features/jobs/components/doc-row.tsx',
  'screens/my/doc-viewer-screen.tsx',
]

describe('file rows', () => {
  it('renders no format-badge square in front of a file name', () => {
    for (const path of files) {
      const text = src(path)
      expect(text, path).not.toContain('FileTag')
      expect(text, path).not.toContain('FileTile')
      expect(text, path).not.toContain('fileKind')
    }
    expect(src('features/jobs/components/doc-row.tsx')).not.toMatch(/>\s*PDF\s*</)
  })
})

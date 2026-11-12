import { isValidElement, type ReactNode } from 'react'
import { LEGAL_OPERATOR, legalDocuments, legalMarkdown, type LegalDocument } from '@push/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ term: undefined as string | undefined, tab: undefined as string | undefined }))

vi.mock('react', async (orig) => {
  const actual = await orig<typeof import('react')>()
  return { ...actual, useState: (init: unknown) => [h.tab ?? init, vi.fn()] }
})
vi.mock('react-native', () => ({ ScrollView: 'ScrollView', View: 'View' }))
vi.mock('expo-router', () => ({ router: { back: vi.fn() }, useLocalSearchParams: () => ({ term: h.term }) }))
vi.mock('@/theme', () => ({ HIT_TARGET: 44, spacing: Array(12).fill(0), useColors: () => ({}) }))
vi.mock('@/shared/components', () => ({ Button: 'Button', CtaBar: 'CtaBar', SegmentedControl: 'SegmentedControl', TopBar: 'TopBar' }))
vi.mock('@/features/auth', async () => ({
  ...(await import('@/features/auth/constants')),
  LegalDocument: 'LegalDocument',
  useTermsConsent: () => vi.fn(),
}))

const { LEGAL_TABS, TERM_DOCUMENTS } = await import('@/features/auth/constants')
const { default: TermsViewScreen } = await import('./auth/terms-view-screen')
const { default: LegalScreen } = await import('./my/legal-screen')

// Escaped because the app's copy check fails on any source line that spells the word.
const WEB_WORD = '\uC5D0\uC774\uC804\uD2B8'
const APP = legalDocuments(LEGAL_OPERATOR, 'app')

const shown = (node: ReactNode): LegalDocument[] => {
  if (Array.isArray(node)) return node.flatMap(shown)
  if (!isValidElement<{ children?: ReactNode; document?: LegalDocument }>(node)) return []
  return node.type === 'LegalDocument' && node.props.document ? [node.props.document] : shown(node.props.children)
}

const screens = [
  ...Object.keys(TERM_DOCUMENTS).map((term) => ({
    name: `약관 보기 ${term}`,
    render: () => {
      h.term = term
      return TermsViewScreen()
    },
  })),
  ...LEGAL_TABS.map(({ key }) => ({
    name: `약관 및 정책 ${key}`,
    render: () => {
      h.tab = key
      return LegalScreen()
    },
  })),
]

describe('legal text the app shows', () => {
  beforeEach(() => {
    h.term = undefined
    h.tab = undefined
  })

  it.each(screens)('$name shows the app rendering, which never says the web-only word', ({ render }) => {
    const documents = shown(render())
    expect(documents).toHaveLength(1)
    expect(documents[0]).toEqual(APP[documents[0].key])
    expect(legalMarkdown(documents[0])).not.toContain(WEB_WORD)
  })
})

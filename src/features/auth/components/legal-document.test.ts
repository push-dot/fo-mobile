import { isValidElement, type ReactElement, type ReactNode } from 'react'
import type { LegalDocument as Document } from '@push/shared'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({ StyleSheet: { hairlineWidth: 1 }, View: 'View', useWindowDimensions: () => ({ fontScale: 1 }) }))
vi.mock('@/shared/components', () => ({ Text: 'Text' }))
vi.mock('@/theme', () => ({
  radius: { md: 12 },
  spacing: [0, 4, 8, 12, 16, 20, 24],
  type: { b1: { lineHeight: 24 } },
  useColors: () => ({ bg2: '#eee', line: '#ddd', t2: '#666' }),
}))

const { default: LegalDocument } = await import('./legal-document')

type Props = { children?: ReactNode; style?: unknown; v?: string }
type Node = ReactElement<Props>

const expand = (node: ReactNode): Node[] => {
  if (Array.isArray(node)) return node.flatMap(expand)
  if (!isValidElement<Props>(node)) return []
  const rendered = typeof node.type === 'function' ? (node.type as (props: Props) => ReactNode)(node.props) : node.props.children
  return [node, ...expand(rendered)]
}

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...[style].flat(3).filter(Boolean))

const render = (blocks: Document['articles'][number]['blocks']) =>
  expand(LegalDocument({ document: { key: 'x', title: 't', effectiveDate: '2026-01-01', version: '1', intro: [], articles: [{ heading: 'h', blocks }] } as unknown as Document }))

describe('LegalDocument spacing follows the v489 boards', () => {
  it('keeps heading to body gap at 8', () => {
    const wrapper = render([{ kind: 'paragraph', text: 'a' }]).find((n) => flat(n.props.style).gap === 8)
    expect(wrapper).toBeDefined()
  })

  it('spaces items by 10 and right-aligns the marker 13pt before the text', () => {
    const nodes = render([{ kind: 'list', ordered: true, items: ['a', 'b'] }])
    expect(nodes.some((n) => flat(n.props.style).gap === 10)).toBe(true)
    const marker = nodes.find((n) => n.props.children === '1.')
    expect(flat(marker?.props.style)).toMatchObject({ width: 48, marginLeft: -20, paddingRight: 13, textAlign: 'right' })
  })

  it('pads the card by 4 and sets the row title b2 over a 21pt detail line', () => {
    const nodes = render([{ kind: 'table', columns: ['k', 'v'], rows: [['title', 'detail']] }])
    expect(nodes.some((n) => flat(n.props.style).paddingVertical === 4 && flat(n.props.style).paddingHorizontal === 16)).toBe(true)
    expect(nodes.find((n) => n.props.children === 'title')?.props.v).toBe('b2')
    expect(flat(nodes.find((n) => n.props.children === 'detail')?.props.style).lineHeight).toBe(21)
  })
})

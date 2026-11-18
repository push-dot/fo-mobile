import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { findAll } from './native-stubs'

vi.mock('react-native', () => ({ View: 'View' }))
vi.mock('../../../theme', async () => {
  const tokens = await import('../../../theme/tokens')
  return { radius: tokens.radius, spacing: tokens.spacing, useColors: () => ({ bg2: '#bg2', line: '#line' }) }
})
vi.mock('../text', () => ({ default: 'Text' }))

const { default: SettingsGroup } = await import('../settings-group')

const row = (key: string) => createElement('Row', { key })

describe('SettingsGroup', () => {
  it('draws a separator above every row after the first, also for rows made by .map()', () => {
    const tree = SettingsGroup({ children: [[row('a'), row('b'), row('c')], row('d'), null, false] })
    const wrappers = findAll(tree, 'View').filter((v) => 'borderTopWidth' in ((v.props.style as object) ?? {}))
    expect(wrappers).toHaveLength(3)
    expect(findAll(tree, 'Row')).toHaveLength(4)
  })

  it('sets the note at the 17pt board line height', () => {
    const tree = SettingsGroup({ note: '메모', children: row('a') })
    expect(findAll(tree, 'Text')[0]?.props.style).toMatchObject({ lineHeight: 17 })
  })
})

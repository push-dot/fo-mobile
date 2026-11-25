import type { ButtonProps } from '@expo/ui/swift-ui'
import type { GlassAction } from './glass-action'

type SFSymbol = NonNullable<ButtonProps['systemImage']>
type SymbolMap = Partial<Record<GlassAction['icon'], SFSymbol>>

export const HEADER_SYMBOLS: SymbolMap = {
  more: 'ellipsis',
  share: 'square.and.arrow.up',
  bookmark: 'bookmark',
  search: 'magnifyingglass',
  inbox: 'tray',
  gear: 'gearshape',
  bell: 'bell',
  plus: 'plus',
  x: 'xmark',
}

const ACTIVE_SYMBOLS: SymbolMap = {
  bookmark: 'bookmark.fill',
  inbox: 'tray.fill',
  gear: 'gearshape.fill',
  bell: 'bell.fill',
}

export const headerSymbol = (a: GlassAction) => (a.active && ACTIVE_SYMBOLS[a.icon]) || HEADER_SYMBOLS[a.icon]

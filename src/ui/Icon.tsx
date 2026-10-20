import { SvgXml } from 'react-native-svg'
import { useColors, type Colors } from '../theme'
import { ICONS_3D, LINE_ICONS, type Icon3DName, type IconName } from './icon-data'

type Props = { name: IconName; size?: number; color?: keyof Colors | (string & {}); filled?: boolean }

/** 24px line icon (2px stroke). `filled` fills the shape, used for saved bookmarks and selected tabs. */
export function Icon({ name, size = 24, color = 't1', filled }: Props) {
  const c = useColors()
  const resolved = (c as Record<string, string>)[color] ?? color
  const xml = filled ? LINE_ICONS[name].replace('fill="none"', 'fill="currentColor"') : LINE_ICONS[name]
  return <SvgXml xml={xml} width={size} height={size} color={resolved} />
}

/** Full-colour 3D icon for home shortcut cards (52px) and quick-start pills (30px) only. */
export function Icon3D({ name, size = 30 }: { name: Icon3DName; size?: number }) {
  return <SvgXml xml={ICONS_3D[name]} width={size} height={size} />
}

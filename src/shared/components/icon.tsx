import { SvgXml } from 'react-native-svg'
import { useColors, type Colors } from '../../theme'
import { LINE_ICONS, type IconName } from './icon-data'

type Props = { name: IconName; size?: number; color?: keyof Colors | (string & {}); filled?: boolean }

const Icon = ({ name, size = 24, color = 't1', filled }: Props) => {
  const c = useColors()
  const resolved = (c as Record<string, string>)[color] ?? color
  const xml = filled ? LINE_ICONS[name].replace('fill="none"', 'fill="currentColor"') : LINE_ICONS[name]
  return <SvgXml xml={xml} width={size} height={size} color={resolved} />
}

export default Icon

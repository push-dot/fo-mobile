import type { ReactNode } from 'react'
import { Platform } from 'react-native'
import { hitSlopTo, radius, spacing, useColors } from '../../theme'
import GlassPressable from './glass-pressable'
import Icon from './icon'
import Text from './text'

type Props = {
  label: string
  on?: boolean
  onPress?: () => void
  onLongPress?: () => void
  menu?: boolean
  check?: boolean
  removable?: boolean
  lead?: ReactNode
}

const CHIP_HEIGHT = 34

const Chip = ({ label, on, onPress, onLongPress, menu, check, removable, lead }: Props) => {
  const c = useColors()
  const fg = on ? c.bg : Platform.OS === 'ios' ? c.t1 : c.t2
  return (
    <GlassPressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={hitSlopTo(CHIP_HEIGHT)}
      glass={!on}
      fill={on ? 't1' : 'fill'}
      style={{ flexGrow: 0, minHeight: CHIP_HEIGHT, borderRadius: radius.chip, maxWidth: '100%' }}
      contentStyle={{ paddingLeft: lead ? 5 : 14, paddingRight: 14, gap: lead || removable ? spacing[2] : spacing[1] }}
    >
      {lead}
      {check && on ? <Icon name="check" size={14} color={fg} /> : null}
      <Text v="c1" weight="600" style={{ fontSize: 14, color: fg, flexShrink: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {menu ? <Icon name="down" size={14} color={fg} /> : null}
      {removable ? <Icon name="x" size={12} color={fg} /> : null}
    </GlassPressable>
  )
}

export default Chip

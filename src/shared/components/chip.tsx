import type { ReactNode } from 'react'
import { Platform } from 'react-native'
import type { IconName } from '@push/design-system'
import { hitSlopTo, radius, spacing, type, useColors } from '../../theme'
import GlassPressable from './glass-pressable'
import Icon from './icon'
import Text from './text'

type Props = {
  label: string
  on?: boolean
  onPress?: () => void
  onLongPress?: () => void
  menu?: boolean
  /** `true` draws the check before the label; `'end'` after it (the proposal sheet's posting chips). */
  check?: boolean | 'end'
  removable?: boolean
  lead?: ReactNode
  icon?: IconName
  chevron?: boolean
  /** Left padding when `lead` is set; the quick-start chip draws 5, the proposal chip 8. */
  leadInset?: number
  /** iOS filter sheets (.ich): 36 high, 15 regular on a white chip, a 16pt check that takes 4 off the left padding. Other platforms draw the normal chip. */
  sheet?: boolean
}

const CHIP_HEIGHT = 34
const SHEET_CHIP_HEIGHT = 36

const Chip = ({ label, on, onPress, onLongPress, menu, check, removable, lead, icon, chevron, leadInset = 5, sheet }: Props) => {
  const c = useColors()
  const ich = !!sheet && Platform.OS === 'ios'
  const height = ich ? SHEET_CHIP_HEIGHT : CHIP_HEIGHT
  const fg = on ? c.bg : Platform.OS === 'ios' ? c.t1 : c.t2
  return (
    <GlassPressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={hitSlopTo(height)}
      glass={false}
      fill={on ? 't1' : ich ? 'paper' : 'fill'}
      style={{ minHeight: height, borderRadius: ich ? height / 2 : radius.chip, maxWidth: '100%' }}
      contentStyle={{ paddingLeft: lead ? leadInset : ich && on && check === true ? 10 : 14, paddingRight: 14, gap: lead || removable ? spacing[2] : spacing[1] }}
    >
      {lead}
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      {check === true && on ? <Icon name="check" size={ich ? 16 : 14} color={fg} /> : null}
      <Text v="c1" weight={ich ? '400' : '600'} style={{ fontSize: ich ? type.b2.fontSize : 14, color: fg, flexShrink: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {check === 'end' && on ? <Icon name="check" size={14} color={fg} /> : null}
      {chevron ? <Icon name="chev" size={14} color={fg} /> : null}
      {menu ? <Icon name="down" size={14} color={fg} /> : null}
      {removable ? <Icon name="x" size={12} color={fg} /> : null}
    </GlassPressable>
  )
}

export default Chip

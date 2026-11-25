import type { ReactNode } from 'react'
import { Platform } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { IconName } from '@push/design-system'
import { hitSlopTo, spacing, type, useColors } from '../../theme'
import GlassPressable from './glass-pressable'
import Icon from './icon'
import Text from './text'

type Props = {
  label: string
  on?: boolean
  onPress?: () => void
  onLongPress?: () => void
  menu?: boolean
  check?: boolean | 'end'
  removable?: boolean
  lead?: ReactNode
  icon?: IconName
  chevron?: boolean
  leadInset?: number
  sheet?: boolean
  fit?: { padding: number; height: number }
}

const CHIP_HEIGHT = 34
const SHEET_CHIP_HEIGHT = 36

const Chip = ({ label, on, onPress, onLongPress, menu, check, removable, lead, icon, chevron, leadInset = 5, sheet, fit }: Props) => {
  const c = useColors()
  const ich = !!sheet && Platform.OS === 'ios'
  const height = fit?.height ?? (ich ? SHEET_CHIP_HEIGHT : CHIP_HEIGHT)
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
      style={styles.chip(height, ich)}
      contentStyle={{ paddingLeft: lead ? leadInset : ich && on && check === true ? 10 : (fit?.padding ?? 14), paddingRight: fit?.padding ?? 14, gap: lead || removable ? spacing[2] : spacing[1] }}
    >
      {lead}
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      {check === true && on ? <Icon name="check" size={ich ? 16 : 14} color={fg} /> : null}
      <Text v="c1" weight={ich ? '400' : '600'} style={styles.label(ich, fg)} numberOfLines={1}>
        {label}
      </Text>
      {check === 'end' && on ? <Icon name="check" size={14} color={fg} /> : null}
      {chevron ? <Icon name="chev" size={14} color={fg} /> : null}
      {menu ? <Icon name="down" size={14} color={fg} /> : null}
      {removable ? <Icon name="x" size={12} color={fg} /> : null}
    </GlassPressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  chip: (height: number, round: boolean) => ({ minHeight: height, borderRadius: round ? height / 2 : theme.radius.chip, maxWidth: '100%' }),
  label: (ich: boolean, color: string) => ({ fontSize: ich ? type.b2.fontSize : 14, color, flexShrink: 1 }),
}))

export default Chip

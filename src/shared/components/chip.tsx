import type { ReactNode } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { radius, useColors } from '../../theme'
import { chipFrame } from './chip-frame'
import { HIT_TARGET } from './hit-target'
import Glass from './glass'
import Icon from './icon'
import Text from './text'

type Props = {
  label: string
  on?: boolean
  onPress?: () => void
  menu?: boolean
  check?: boolean
  removable?: boolean
  lead?: ReactNode
}

const Chip = ({ label, on, onPress, menu, check, removable, lead }: Props) => {
  const c = useColors()
  const fg = on ? c.acText : c.t2
  const inner = (
    <View
      style={{
        minHeight: HIT_TARGET,
        paddingHorizontal: 14,
        paddingLeft: lead ? 8 : 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: lead ? 8 : 4,
      }}
    >
      {lead}
      {check && on ? <Icon name="check" size={14} color={fg} /> : null}
      <Text v="c1" weight="600" style={{ fontSize: 14, color: fg, flexShrink: 1 }} numberOfLines={1}>
        {label}
      </Text>
      {menu ? <Icon name="down" size={14} color={fg} /> : null}
      {removable ? <Icon name="x" size={12} color={fg} /> : null}
    </View>
  )
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress} style={{ maxWidth: '100%' }}>
      {on ? (
        <View style={[{ borderRadius: radius.pill }, chipFrame(true, c)]}>{inner}</View>
      ) : Platform.OS === 'ios' ? (
        <Glass interactive style={{ borderRadius: radius.pill }}>
          {inner}
        </Glass>
      ) : (
        <View style={[{ borderRadius: radius.pill }, chipFrame(false, c)]}>{inner}</View>
      )}
    </Pressable>
  )
}

export default Chip

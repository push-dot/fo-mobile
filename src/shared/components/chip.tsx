import { Platform, Pressable, View } from 'react-native'
import { radius, useColors } from '../../theme'
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
}

const Chip = ({ label, on, onPress, menu, check, removable }: Props) => {
  const c = useColors()
  const fg = on ? c.bg : c.t2
  const inner = (
    <View style={{ height: 34, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {check && on ? <Icon name="check" size={14} color={fg} /> : null}
      <Text v="c1" weight="600" style={{ fontSize: 14, color: fg }} numberOfLines={1}>
        {label}
      </Text>
      {menu ? <Icon name="down" size={14} color={fg} /> : null}
      {removable ? <Icon name="x" size={12} color={fg} /> : null}
    </View>
  )
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress}>
      {on ? (
        <View style={{ borderRadius: radius.pill, backgroundColor: c.t1 }}>{inner}</View>
      ) : Platform.OS === 'ios' ? (
        <Glass interactive style={{ borderRadius: radius.pill }}>
          {inner}
        </Glass>
      ) : (
        <View style={{ borderRadius: radius.pill, backgroundColor: c.fill }}>{inner}</View>
      )}
    </Pressable>
  )
}

export default Chip

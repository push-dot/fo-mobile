import { Pressable, View } from 'react-native'
import { useColors } from '../../theme'
import Icon from './icon'
import type { IconName } from './icon-data'
import Text from './text'

export type GlassAction = {
  icon: IconName
  label: string
  onPress?: () => void
  active?: boolean
  badge?: number
}

const GlassActionButton = ({ a, width }: { a: GlassAction; width: number }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a.label}
      accessibilityState={{ selected: !!a.active }}
      onPress={a.onPress}
      hitSlop={4}
      style={{ height: 44, minWidth: width, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={a.icon} size={22} color={a.active ? c.acText : c.t1} filled={a.active} />
      {a.badge ? (
        <View style={{ position: 'absolute', top: 4, right: 2, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: c.red, alignItems: 'center', justifyContent: 'center' }}>
          <Text v="c2" weight="800" style={{ color: '#FFFFFF', fontSize: 11, lineHeight: 18 }}>
            {a.badge > 99 ? '99+' : a.badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

export default GlassActionButton

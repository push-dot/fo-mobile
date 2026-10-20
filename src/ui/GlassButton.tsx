import { Platform, Pressable, View } from 'react-native'
import { useColors } from '../theme'
import { Glass } from './Glass'
import { Icon } from './Icon'
import type { IconName } from './icon-data'
import { Text } from './Text'

export type GlassAction = {
  icon: IconName
  label: string
  onPress?: () => void
  /** Selected/saved: icon turns ac-text and fills. */
  active?: boolean
  badge?: number
}

const Action = ({ a, width }: { a: GlassAction; width: number }) => {
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

/** iOS: round 44px glass button, or a capsule grouping related actions. Android: flat icons. */
export function GlassButton({ actions }: { actions: GlassAction[] }) {
  const single = actions.length === 1
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: single ? 0 : 4 }}>
      {actions.map((a) => (
        <Action key={a.label} a={a} width={single ? 44 : 40} />
      ))}
    </View>
  )
  if (Platform.OS === 'android') return row
  return (
    <Glass interactive style={{ borderRadius: 22, minWidth: 44, height: 44, justifyContent: 'center' }}>
      {row}
    </Glass>
  )
}

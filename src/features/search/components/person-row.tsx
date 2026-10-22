import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { Profile } from '@push/api-client'
import { Text } from '../../../shared/components'
import { useColors } from '../../../theme'
import Highlight from './highlight'

const PersonRow = ({ p, q, onOpen }: { p: Profile; q: string; onOpen: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onOpen()
        router.push(`/profiles/${p.userId}`)
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 }}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.acSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Text v="c1" weight="700" color="acText">
          {p.displayName.length === 3 ? p.displayName.slice(1) : p.displayName.slice(0, 2)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text v="b1" weight="700" numberOfLines={1}>
          <Highlight text={p.displayName} q={q} />
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          <Highlight text={p.headline} q={q} />
        </Text>
      </View>
    </Pressable>
  )
}

export default PersonRow

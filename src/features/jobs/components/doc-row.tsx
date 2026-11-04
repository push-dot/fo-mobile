import { Pressable, View } from 'react-native'
import { Text } from '../../../shared/components'
import { useColors } from '../../../theme'
import type { ApplyDoc } from '../types'

const DocRow = ({ doc, on, onPress }: { doc: ApplyDoc; on: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: on ? 7 : 2, borderColor: on ? c.ac : c.t4 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="600" numberOfLines={1}>
          {doc.name}
        </Text>
        <Text v="c1" color="t3">
          {doc.note}
        </Text>
      </View>
    </Pressable>
  )
}

export default DocRow

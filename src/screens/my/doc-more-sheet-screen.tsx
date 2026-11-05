import { router, useLocalSearchParams } from 'expo-router'
import { Pressable, View } from 'react-native'
import { SHEET_SWAP_MS, useDocDelete, useSource } from '@/features/my'
import { Icon, Sheet, Text, type IconName } from '@/shared/components'
import { spacing } from '@/theme'

const ICON_BOX = 24

const MoreRow = ({ icon, label, danger, onPress }: { icon: IconName; label: string; danger?: boolean; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4], minHeight: 56 }}
  >
    <View style={{ width: ICON_BOX, alignItems: 'center' }}>
      <Icon name={icon} size={20} color={danger ? 'red' : 't2'} />
    </View>
    <Text v="b1" weight="600" color={danger ? 'red' : 't1'} style={{ flex: 1 }}>
      {label}
    </Text>
  </Pressable>
)

const DocMoreSheetScreen = () => {
  const { id, viewing } = useLocalSearchParams<{ id: string; viewing?: string }>()
  const doc = useSource(id).data
  const open = () => {
    router.back()
    router.push(`/docs/${id}`)
  }
  const remove = () => {
    if (!doc) return
    router.back()
    setTimeout(() => useDocDelete.setState({ doc }), SHEET_SWAP_MS)
  }
  return (
    <Sheet gap={spacing[3]}>
      <Text v="h3" numberOfLines={1}>
        {doc?.fileName}
      </Text>
      <View>
        {viewing ? null : <MoreRow icon="eye-2" label="서류 보기" onPress={open} />}
        <MoreRow icon="delete" label="서류 삭제하기" danger onPress={remove} />
      </View>
    </Sheet>
  )
}

export default DocMoreSheetScreen

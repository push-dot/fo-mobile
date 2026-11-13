import { router } from 'expo-router'
import { View } from 'react-native'
import { Button, GlassButton, Text } from '@/shared/components'
import { spacing } from '../../../theme'

const SheetHeader = ({
  title,
  onSave,
  saving,
  canSave = true,
}: {
  title: string
  onSave: () => void
  saving?: boolean
  canSave?: boolean
}) => {
  const disabled = saving || !canSave
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[4],
      }}
    >
      <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
      <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
        {title}
      </Text>
      <Button label={saving ? '저장 중' : '저장'} size="pill" disabled={disabled} onPress={onSave} />
    </View>
  )
}

export default SheetHeader

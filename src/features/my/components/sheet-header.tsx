import { router } from 'expo-router'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Button, GlassButton, Text } from '@/shared/components'

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
    <View style={styles.row}>
      <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
      <Text v="h3" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Button label={saving ? '저장 중' : '저장'} size="pill" disabled={disabled} onPress={onSave} />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
  },
  title: { flex: 1, textAlign: 'center' },
}))

export default SheetHeader

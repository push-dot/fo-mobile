import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { GlassButton, Text } from '@/shared/components'
import { useColors } from '../../../theme'

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
  const c = useColors()
  const disabled = saving || !canSave
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
      }}
    >
      <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
      <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: saving }}
        disabled={disabled}
        onPress={onSave}
        style={{
          height: 44,
          borderRadius: 22,
          paddingHorizontal: 18,
          backgroundColor: c.ac,
          justifyContent: 'center',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <Text v="c1" weight="700" style={{ color: '#FFFFFF', fontSize: 14 }}>
          {saving ? '저장 중' : '저장'}
        </Text>
      </Pressable>
    </View>
  )
}

export default SheetHeader

import { router } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'
import { Button, Sheet, Text, useConfirmStore } from '@/shared/components'
import { spacing } from '@/theme'

const ConfirmSheetScreen = () => {
  const request = useConfirmStore((s) => s.request)

  useEffect(() => {
    if (!request) router.back()
  }, [request])

  useEffect(() => () => useConfirmStore.getState().set(null), [])

  if (!request) return null

  return (
    <Sheet gap={spacing[2]}>
      <View accessibilityRole="alert" style={{ gap: spacing[2] }}>
        <Text v="h3" accessibilityRole="header" style={{ paddingTop: spacing[1] }}>
          {request.title}
        </Text>
        <Text v="b2" color="t2">
          {request.body}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] }}>
        <Button label={request.cancel ?? '취소'} variant="secondary" onPress={() => router.back()} style={{ flex: 1 }} />
        <Button
          label={request.confirm}
          variant={request.danger ? 'danger' : 'primary'}
          onPress={() => {
            router.back()
            request.onConfirm()
          }}
          style={{ flex: 1 }}
        />
      </View>
    </Sheet>
  )
}

export default ConfirmSheetScreen

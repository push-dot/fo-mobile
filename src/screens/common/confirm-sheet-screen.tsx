import { router } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'
import { Button, Sheet, Text, useConfirmStore } from '@/shared/components'

const ConfirmSheetScreen = () => {
  const request = useConfirmStore((s) => s.request)

  useEffect(() => {
    if (!request) router.back()
  }, [request])

  useEffect(() => () => useConfirmStore.getState().set(null), [])

  if (!request) return null

  return (
    <Sheet>
      <View accessibilityRole="alert" style={{ gap: 6 }}>
        <Text v="h3" accessibilityRole="header">
          {request.title}
        </Text>
        <Text v="b2" color="t2">
          {request.body}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
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

import { router } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Sheet, Text } from '@/shared/components'
import { CHOICE_HANDOFF_MS, useChoiceModal } from '@/shared/navigation'
import { spacing, useColors } from '@/theme'

const ChoiceSheetScreen = () => {
  const c = useColors()
  const request = useChoiceModal((s) => s.request)
  useEffect(() => {
    if (!request) router.back()
  }, [request])
  if (!request) return null
  const run = (onPress: () => void) => {
    router.back()
    setTimeout(onPress, CHOICE_HANDOFF_MS)
  }
  return (
    <Sheet title={request.title} description={request.message} gap={spacing[2]} action={request.confirm ? { label: request.confirm.label, onPress: () => run(request.confirm!.onPress) } : undefined}>
      {request.items ? (
        <View>
          {request.items.map((item, i) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => run(item.onPress)}
              style={{ minHeight: 52, justifyContent: 'center', paddingHorizontal: spacing[1], borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: c.line }}
            >
              <Text v="b1" weight="600" color={item.destructive ? 'red' : 't1'}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Sheet>
  )
}

export default ChoiceSheetScreen

import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Pressable, View } from 'react-native'
import { Sheet, Text } from '@/shared/components'
import { CHOICE_HANDOFF_MS, useChoiceModal } from '@/shared/navigation'
import { spacing, useColors } from '@/theme'

const ChoiceSheetScreen = () => {
  const c = useColors()
  const request = useChoiceModal((s) => s.request)
  const picked = useRef(false)
  const onDismiss = request?.onDismiss
  useEffect(() => {
    if (!request) router.back()
  }, [request])
  useEffect(() => () => {
    if (!picked.current) onDismiss?.()
  }, [onDismiss])
  if (!request) return null
  const run = (onPress: () => void) => {
    picked.current = true
    router.back()
    setTimeout(onPress, CHOICE_HANDOFF_MS)
  }
  // `.pm-h .nt`: 17 semibold, centred, in a 52 high head; `.pm-row`: 17 regular (h3 at 400), 50 high, a line under every row but the last.
  return (
    <Sheet gap={6} action={request.confirm ? { label: request.confirm.label, onPress: () => run(request.confirm!.onPress) } : undefined}>
      <View style={{ minHeight: 52, justifyContent: 'center' }}>
        <Text v="h3" weight="600" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {request.title}
        </Text>
      </View>
      {request.message ? (
        <Text v={request.items ? 'b2' : 'b1'} color="t2" style={{ paddingHorizontal: spacing[1] }}>
          {request.message}
        </Text>
      ) : null}
      {request.items ? (
        <View style={{ gap: 6 }}>
          {request.items.map((item, i) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => run(item.onPress)}
              style={{ minHeight: 50, justifyContent: 'center', paddingHorizontal: spacing[1], borderBottomWidth: i < request.items!.length - 1 ? 1 : 0, borderBottomColor: c.line }}
            >
              <Text v="h3" weight="400" color={item.destructive ? 'red' : 't1'}>
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

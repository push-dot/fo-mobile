import { useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius } from '../../theme'
import { TOAST_BOTTOM_GAP } from './constants'
import Glass from './glass'
import Text from './text'
import { hideToast, toastDuration, useHostedToast } from './toast-store'

/** iOS has no system toast, so this is a Liquid Glass capsule (UIGlassEffect, solid when transparency is reduced). */
const ToastHost = () => {
  const toast = useHostedToast()
  const insets = useSafeAreaInsets()
  const [shown] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (!toast) return
    shown.setValue(0)
    Animated.spring(shown, { toValue: 1, useNativeDriver: true }).start()
    AccessibilityInfo.announceForAccessibility(toast.message)
    const timer = setTimeout(() => hideToast(toast.id), toastDuration(toast))
    return () => clearTimeout(timer)
  }, [toast, shown])
  if (!toast) return null
  const translateY = shown.interpolate({ inputRange: [0, 1], outputRange: [24, 0] })
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + TOAST_BOTTOM_GAP, opacity: shown, transform: [{ translateY }] }}
    >
      <Glass interactive style={{ borderRadius: radius.pill }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 20 }}>
          <Text v="b2" weight="600" style={{ flex: 1 }}>
            {toast.message}
          </Text>
          {toast.action ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                toast.action?.onPress()
                hideToast(toast.id)
              }}
            >
              <Text v="b2" weight="700" color="acText">
                {toast.action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Glass>
    </Animated.View>
  )
}

export default ToastHost

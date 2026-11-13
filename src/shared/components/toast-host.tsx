import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Animated, Platform, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cssShadow, palette, radius, spacing, toast as toastColor, useColors, useThemeMode } from '../../theme'
import { TOAST_BOTTOM_GAP, TOAST_SHEET_GAP } from './constants'
import Glass from './glass'
import GlassPressable from './glass-pressable'
import Text from './text'
import { hideToast, toastDuration, topSheet, useHostedToast, useToastStore } from './toast-store'
import { useReduceMotion } from './use-reduce-motion'

const TOAST_HEIGHT = 52
const ACTION_HEIGHT = 44
// v412 boards: iOS shows a top notification banner (one line, no app tile), Android the Material snackbar (8pt side margin, 4pt corners).
const SHAPE = Platform.OS === 'ios'
  ? { inset: spacing[4], radius: 22, shadow: cssShadow.toast }
  : { inset: spacing[2], radius: 4, shadow: cssShadow.toast }

// Not the Material snackbar: @expo/ui's Snackbar has a fixed shape (no 16pt radius or 52pt height) and no dismiss API.
const Surface = ({ shape, shadow, opaque, children }: { shape: ViewStyle; shadow: string; opaque?: boolean; children: ReactNode }) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  if (Platform.OS === 'ios' && !opaque)
    return (
      <Glass tint={dark ? c.glass : undefined} style={[shape, { boxShadow: shadow }]}>
        {children}
      </Glass>
    )
  return <View style={[shape, { backgroundColor: Platform.OS === 'ios' ? c.paper : c.t1, boxShadow: shadow }]}>{children}</View>
}

const ToastHost = () => {
  const ios = Platform.OS === 'ios'
  const toast = useHostedToast()
  const sheet = useToastStore(topSheet)
  const insets = useSafeAreaInsets()
  const c = useColors()
  const still = useReduceMotion()
  const dark = useThemeMode() === 'dark'
  // Android's card is inverse (t1); the design draws only the light theme, with its own lighter action purple.
  const ink = Platform.OS === 'ios' ? { text: c.t1, action: c.acText } : { text: c.bg, action: dark ? palette.light.acText : toastColor.androidAction }
  const [shown] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (!toast) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let live = true
    shown.setValue(0)
    Animated.spring(shown, { toValue: 1, useNativeDriver: true }).start()
    // Android reads the live region below; announcing as well would read it twice.
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(toast.message)
    const base = toastDuration(toast)
    // TalkBack's timeout only lengthens it; RN resolves 0 when the AccessibilityManager is missing (seen on the gate emulator).
    void AccessibilityInfo.getRecommendedTimeoutMillis(base).then((ms) => {
      if (live) timer = setTimeout(() => hideToast(toast.id), Math.max(base, ms))
    })
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [toast, shown])
  if (!toast) return null
  const translateY = shown.interpolate({ inputRange: [0, 1], outputRange: [still ? 0 : ios ? -24 : 24, 0] })
  const shape = SHAPE
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: shape.inset,
        right: shape.inset,
        ...(ios ? { top: insets.top + spacing[1] } : { bottom: sheet ? sheet + TOAST_SHEET_GAP : insets.bottom + (toast.bottom ?? TOAST_BOTTOM_GAP) }),
        // UIKit drops a glass effect that installs under a nearly transparent ancestor, so the iOS card only slides in.
        opacity: Platform.OS === 'ios' ? 1 : shown,
        transform: [{ translateY }],
      }}
    >
      <Surface shape={{ borderRadius: shape.radius }} shadow={shape.shadow} opaque={toast.opaque}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: TOAST_HEIGHT, paddingLeft: spacing[4], paddingRight: toast.action ? spacing[2] : spacing[4] }}>
          <Text v="b2" weight="600" style={{ flex: 1, color: ink.text }}>
            {toast.message}
          </Text>
          {toast.action ? (
            <GlassPressable
              accessibilityRole="button"
              glass={false}
              fill={null}
              style={{ height: ACTION_HEIGHT, borderRadius: radius.sm }}
              contentStyle={{ paddingHorizontal: spacing[3] }}
              onPress={() => {
                toast.action?.onPress()
                hideToast(toast.id)
              }}
            >
              <Text v="b2" weight="700" style={{ color: ink.action }}>
                {toast.action.label}
              </Text>
            </GlassPressable>
          ) : null}
        </View>
      </Surface>
    </Animated.View>
  )
}

export default ToastHost

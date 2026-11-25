import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Animated, Platform, PlatformColor, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cssShadow, iosMaterial, palette, radius, spacing, toast as toastColor, useColors, useThemeMode } from '../../theme'
import { TOAST_BOTTOM_GAP, TOAST_SHEET_GAP } from './constants'
import GlassPressable from './glass-pressable'
import Text from './text'
import { hideToast, toastDuration, topSheet, useHostedToast, useToastStore } from './toast-store'
import { useReduceMotion } from './use-reduce-motion'

const ACTION_HEIGHT = 44
const TOAST_IOS_PAD = 10
const SHAPE = Platform.OS === 'ios'
  ? { inset: spacing[2], radius: 26, shadow: cssShadow.banner, minHeight: 64, top: 2 }
  : { inset: spacing[2], radius: 4, shadow: cssShadow.toast, minHeight: 52, top: 0 }

const Surface = ({ shape, shadow, children }: { shape: ViewStyle; shadow: string; children: ReactNode }) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  return (
    <View pointerEvents="box-none" style={[shape, { backgroundColor: Platform.OS === 'ios' ? iosMaterial[dark ? 'dark' : 'light'] : c.t1, boxShadow: shadow }]}>
      {children}
    </View>
  )
}

const ToastHost = () => {
  const ios = Platform.OS === 'ios'
  const toast = useHostedToast()
  const sheet = useToastStore(topSheet)
  const insets = useSafeAreaInsets()
  const c = useColors()
  const still = useReduceMotion()
  const dark = useThemeMode() === 'dark'
  const ink = Platform.OS === 'ios' ? { text: c.t1, action: PlatformColor('systemBlue') } : { text: c.bg, action: dark ? palette.light.acText : toastColor.androidAction }
  const [shown] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (!toast) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let live = true
    shown.setValue(0)
    Animated.spring(shown, { toValue: 1, useNativeDriver: true }).start()
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(toast.message)
    const base = toastDuration(toast)
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
      pointerEvents={toast.action ? 'box-none' : 'none'}
      style={{
        position: 'absolute',
        left: shape.inset,
        right: shape.inset,
        ...(ios ? { top: insets.top + shape.top } : { bottom: sheet ? sheet + TOAST_SHEET_GAP : insets.bottom + (toast.bottom ?? TOAST_BOTTOM_GAP) }),
        opacity: Platform.OS === 'ios' ? 1 : shown,
        transform: [{ translateY }],
      }}
    >
      <Surface shape={{ borderRadius: shape.radius }} shadow={shape.shadow}>
        <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: shape.minHeight, paddingLeft: ios ? spacing[5] : spacing[4], paddingRight: toast.action && !ios ? spacing[2] : spacing[4], paddingVertical: ios ? TOAST_IOS_PAD : 0 }}>
          <Text v="b2" weight="600" pointerEvents="none" style={{ flex: 1, color: ink.text, ...(ios ? { lineHeight: 20 } : null) }}>
            {toast.message}
          </Text>
          {toast.action ? (
            <GlassPressable
              accessibilityRole="button"
              glass={false}
              fill={null}
              style={{ height: ACTION_HEIGHT, borderRadius: radius.sm, ...(ios ? { marginHorizontal: -spacing[3] } : null) }}
              contentStyle={{ paddingHorizontal: spacing[3] }}
              onPress={() => {
                toast.action?.onPress()
                hideToast(toast.id)
              }}
            >
              <Text v="b2" weight={ios ? '600' : '700'} style={{ color: ink.action, ...(ios ? { lineHeight: 20 } : null) }}>
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

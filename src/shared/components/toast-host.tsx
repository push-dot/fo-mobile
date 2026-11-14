import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Animated, Platform, PlatformColor, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cssShadow, palette, radius, spacing, toast as toastColor, useColors, useThemeMode } from '../../theme'
import { TOAST_BOTTOM_GAP, TOAST_SHEET_GAP } from './constants'
import Glass from './glass'
import GlassPressable from './glass-pressable'
import Text from './text'
import { hideToast, toastDuration, topSheet, useHostedToast, useToastStore } from './toast-store'
import { useReduceMotion } from './use-reduce-motion'

const ACTION_HEIGHT = 44
// iOS banner: the 44pt action sits in the 64pt board card, so the padding is (64 - 44) / 2 = 10 (12 made the card 68).
const TOAST_IOS_PAD = 10
// v415 boards: iOS shows a top notification banner (.ibanner: 8pt side margin, 26pt corners, min-height 64, one line, no app tile: rule 16), Android the Material snackbar (8pt side margin, 4pt corners).
const SHAPE = Platform.OS === 'ios'
  ? { inset: spacing[2], radius: 26, shadow: cssShadow.banner, minHeight: 64, top: 2 }
  : { inset: spacing[2], radius: 4, shadow: cssShadow.toast, minHeight: 52, top: 0 }

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
  return (
    <View pointerEvents="box-none" style={[shape, { backgroundColor: Platform.OS === 'ios' ? c.paper : c.t1, boxShadow: shadow }]}>
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
  // Android's card is inverse (t1); the design draws only the light theme, with its own lighter action purple.
  // iOS action word is system blue (.ib-a: --iBlue), not the accent: rule 3.
  const ink = Platform.OS === 'ios' ? { text: c.t1, action: PlatformColor('systemBlue') } : { text: c.bg, action: dark ? palette.light.acText : toastColor.androidAction }
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
      // A banner over the header must not eat the back button's touch: only its action takes touches (a failed delete left 뒤로 dead for 5 s).
      pointerEvents={toast.action ? 'box-none' : 'none'}
      style={{
        position: 'absolute',
        left: shape.inset,
        right: shape.inset,
        ...(ios ? { top: insets.top + shape.top } : { bottom: sheet ? sheet + TOAST_SHEET_GAP : insets.bottom + (toast.bottom ?? TOAST_BOTTOM_GAP) }),
        // UIKit drops a glass effect that installs under a nearly transparent ancestor, so the iOS card only slides in.
        opacity: Platform.OS === 'ios' ? 1 : shown,
        transform: [{ translateY }],
      }}
    >
      <Surface shape={{ borderRadius: shape.radius }} shadow={shape.shadow} opaque={toast.opaque}>
        <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: shape.minHeight, paddingLeft: ios ? spacing[5] : spacing[4], paddingRight: toast.action && !ios ? spacing[2] : spacing[4], paddingVertical: ios ? TOAST_IOS_PAD : 0 }}>
          <Text v="b2" weight="600" style={{ flex: 1, color: ink.text, ...(ios ? { lineHeight: 20 } : null) }}>
            {toast.message}
          </Text>
          {toast.action ? (
            <GlassPressable
              accessibilityRole="button"
              glass={false}
              fill={null}
              // iOS: the word sits 16pt from the edge and 12pt from the text, as the board draws it; the 44pt target reaches past it.
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

import { useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Animated, Platform, PlatformColor, View, type ColorValue, type ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cssShadow, iosMaterial, palette, spacing, toast as toastColor, useColors, useThemeMode } from '../../theme'
import { TOAST_BOTTOM_GAP, TOAST_SHEET_GAP } from './constants'
import GlassPressable from './glass-pressable'
import Text from './text'
import { hideToast, toastDuration, topSheet, useHostedToast, useToastStore } from './toast-store'
import { useReduceMotion } from './use-reduce-motion'

const ACTION_HEIGHT = 44
const TOAST_IOS_PAD = 10
const ios = Platform.OS === 'ios'
const SHAPE = ios
  ? { inset: spacing[2], radius: 26, shadow: cssShadow.banner, minHeight: 64, top: 2 }
  : { inset: spacing[2], radius: 4, shadow: cssShadow.toast, minHeight: 52, top: 0 }

const Surface = ({ shape, shadow, children }: { shape: ViewStyle; shadow: string; children: ReactNode }) => (
  <View pointerEvents="box-none" style={[shape, styles.surface(shadow)]}>
    {children}
  </View>
)

const ToastHost = () => {
  const toast = useHostedToast()
  const sheet = useToastStore(topSheet)
  const insets = useSafeAreaInsets()
  const c = useColors()
  const still = useReduceMotion()
  const dark = useThemeMode() === 'dark'
  const ink = ios ? { text: c.t1, action: PlatformColor('systemBlue') } : { text: c.bg, action: dark ? palette.light.acText : toastColor.androidAction }
  const [shown] = useState(() => new Animated.Value(0))
  useEffect(() => {
    if (!toast) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let live = true
    shown.setValue(0)
    Animated.spring(shown, { toValue: 1, useNativeDriver: true }).start()
    if (ios) AccessibilityInfo.announceForAccessibility(toast.message)
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
  const motion = { opacity: ios ? 1 : shown, transform: [{ translateY }] }
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents={toast.action ? 'box-none' : 'none'}
      style={[
        styles.toast,
        ios ? styles.top(insets.top + SHAPE.top) : styles.bottom(sheet ? sheet + TOAST_SHEET_GAP : insets.bottom + (toast.bottom ?? TOAST_BOTTOM_GAP)),
        motion,
      ]}
    >
      <Surface shape={{ borderRadius: SHAPE.radius }} shadow={SHAPE.shadow}>
        <View pointerEvents="box-none" style={[styles.row, ios && styles.rowIos, !!toast.action && !ios && styles.rowAction]}>
          <Text v="b2" weight="600" pointerEvents="none" style={[styles.message(ink.text), ios && styles.iosLine]}>
            {toast.message}
          </Text>
          {toast.action ? (
            <GlassPressable
              accessibilityRole="button"
              glass={false}
              fill={null}
              style={[styles.action, ios && styles.actionIos]}
              contentStyle={{ paddingHorizontal: spacing[3] }}
              onPress={() => {
                toast.action?.onPress()
                hideToast(toast.id)
              }}
            >
              <Text v="b2" weight={ios ? '600' : '700'} style={[styles.ink(ink.action), ios && styles.iosLine]}>
                {toast.action.label}
              </Text>
            </GlassPressable>
          ) : null}
        </View>
      </Surface>
    </Animated.View>
  )
}

const styles = StyleSheet.create((theme) => ({
  surface: (shadow: string) => ({ backgroundColor: ios ? iosMaterial[theme.mode] : theme.colors.t1, boxShadow: shadow }),
  toast: { position: 'absolute', left: SHAPE.inset, right: SHAPE.inset },
  top: (top: number) => ({ top }),
  bottom: (bottom: number) => ({ bottom }),
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], minHeight: SHAPE.minHeight, paddingLeft: theme.spacing[4], paddingRight: theme.spacing[4], paddingVertical: 0 },
  rowIos: { paddingLeft: theme.spacing[5], paddingVertical: TOAST_IOS_PAD },
  rowAction: { paddingRight: theme.spacing[2] },
  message: (color: ColorValue) => ({ flex: 1, color }),
  ink: (color: ColorValue) => ({ color }),
  iosLine: { lineHeight: 20 },
  action: { height: ACTION_HEIGHT, borderRadius: theme.radius.sm },
  actionIos: { marginHorizontal: -theme.spacing[3] },
}))

export default ToastHost

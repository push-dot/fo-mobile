import { useNavigation } from 'expo-router'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Platform, View, type ViewProps } from 'react-native'
import { initialWindowMetrics, SafeAreaProvider, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { spacing } from '../../theme'
import Button from './button'
import { GRABBER } from './constants'
import { SheetSurface } from './sheet-surface'
import { PM8_SLIM_ACTION } from './pm8'
import { floatingSheet } from './sheet-scale'
import { useKeyboardHeight } from './use-keyboard-height'
import Text from './text'
import { mountSheet, sizeSheet } from './toast-store'

type Props = {
  title?: string
  description?: string
  children?: ReactNode
  action?: { label: string; onPress: () => void; disabled?: boolean; pending?: boolean }
  secondary?: { label: string; onPress: () => void }
  secondaryGap?: number
  gap?: number
  actionGap?: number
  slimAction?: boolean
  topGap?: number
  secondaryFill?: string
  bottomExtra?: number
  onLayout?: ViewProps['onLayout']
  full?: boolean
}

const SHEET_GAP = 14
const SLIM_ACTION_BOTTOM = 6
const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 }
const HOME_INSET = initialWindowMetrics?.insets.bottom ?? 0

const Body = ({ title, description, children, action, secondary, secondaryGap, gap = SHEET_GAP, actionGap, slimAction, bottomExtra = 0, topGap = gap, secondaryFill, onLayout, full, homeInset = 0 }: Props & { homeInset?: number }) => {
  const insets = useSafeAreaInsets()
  const android = Platform.OS === 'android'
  const id = useId()
  const closing = useRef(false)
  const navigation = useNavigation<{ addListener: (type: 'beforeRemove', listener: () => void) => () => void }>()
  useEffect(() => {
    if (!android) return
    const close = mountSheet(id, Platform.OS)
    const sub = navigation.addListener('beforeRemove', () => {
      closing.current = true
      close()
    })
    return () => (sub(), close())
  }, [android, id, navigation])
  return (
    <View
      onLayout={(e) => {
        if (android && !closing.current) sizeSheet(id, e.nativeEvent.layout.height)
        onLayout?.(e)
      }}
      style={[
        styles.body(
          android ? spacing[3] : spacing[3] + GRABBER.ios.height + topGap,
          android
            ? insets.bottom + spacing[3]
            : full
              ? homeInset + spacing[3]
              : (insets.bottom || (homeInset ? 0 : spacing[5])) + (slimAction ? SLIM_ACTION_BOTTOM : 0) + bottomExtra,
          gap,
        ),
        (android || full) && styles.bodyWide,
        full && styles.fill,
      ]}
    >
      {android ? (
        <View style={styles.grabber} />
      ) : null}
      {title ? (
        <View style={styles.header}>
          {title ? (
            <View style={styles.titles}>
              <Text v="h2" accessibilityRole="header">
                {title}
              </Text>
              {description ? (
                <Text v="b2" color="t3">
                  {description}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
      {children}
      {action ? <Button label={action.label} onPress={action.onPress} disabled={action.disabled} pending={action.pending} style={[full ? styles.actionEnd : actionGap ? styles.gapTop(actionGap) : null, slimAction && PM8_SLIM_ACTION]} /> : null}
      {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} style={[secondaryGap === undefined ? null : styles.gapTop(secondaryGap - gap), secondaryFill ? styles.secondaryFill(secondaryFill) : null]} /> : null}
    </View>
  )
}

const IosSheet = (props: Props) => {
  const frame = useSafeAreaFrame()
  const [height, setHeight] = useState(0)
  const keyboardUp = useKeyboardHeight() > 0
  const float = props.full ? null : floatingSheet(frame.width, Platform.Version, HOME_INSET, keyboardUp)
  return (
    <SafeAreaProvider initialMetrics={{ frame, insets: NO_INSETS }} style={props.full ? styles.fill : styles.shrink}>
      <View
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={float ? styles.float(float.width, float.scale, height ? float.marginBottom(height) : 0) : props.full ? styles.fill : null}
      >
        <SheetSurface.Provider value={!props.full}>
          <Body {...props} homeInset={HOME_INSET} />
        </SheetSurface.Provider>
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create((theme) => ({
  body: (paddingTop: number, paddingBottom: number, gap: number) => ({ paddingTop, paddingHorizontal: theme.spacing[4], paddingBottom, gap }),
  bodyWide: { paddingHorizontal: theme.spacing[5] },
  fill: { flex: 1 },
  shrink: { flex: 0 },
  grabber: { ...GRABBER.android, backgroundColor: theme.colors.deco, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  titles: { flex: 1, gap: theme.spacing[1] },
  actionEnd: { marginTop: 'auto' },
  gapTop: (marginTop: number) => ({ marginTop }),
  secondaryFill: (backgroundColor: string) => ({ backgroundColor }),
  float: (width: number, scale: number, marginBottom: number) => ({ width, alignSelf: 'center', transformOrigin: 'top', transform: [{ scale }], marginBottom }),
}))

const Sheet = Platform.OS === 'android' ? Body : IosSheet

export default Sheet

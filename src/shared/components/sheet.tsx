import { useNavigation } from 'expo-router'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Platform, View, type ViewProps } from 'react-native'
import { initialWindowMetrics, SafeAreaProvider, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, useColors } from '../../theme'
import Button from './button'
import { GRABBER } from './constants'
import { SheetSurface } from './glass'
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
  const c = useColors()
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
      style={{
        flex: full ? 1 : undefined,
        paddingTop: android ? spacing[3] : spacing[3] + GRABBER.ios.height + topGap,
        paddingHorizontal: android || full ? spacing[5] : spacing[4],
        paddingBottom: android
          ? insets.bottom + spacing[3]
          : full
            ? homeInset + spacing[3]
            : (insets.bottom || (homeInset ? 0 : spacing[5])) + (slimAction ? SLIM_ACTION_BOTTOM : 0) + bottomExtra,
        gap,
      }}
    >
      {android ? (
        <View style={{ ...GRABBER.android, backgroundColor: c.deco, alignSelf: 'center' }} />
      ) : null}
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          {title ? (
            <View style={{ flex: 1, gap: spacing[1] }}>
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
      {action ? <Button label={action.label} onPress={action.onPress} disabled={action.disabled} pending={action.pending} style={[full ? { marginTop: 'auto' } : actionGap ? { marginTop: actionGap } : null, slimAction && PM8_SLIM_ACTION]} /> : null}
      {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} style={[secondaryGap === undefined ? null : { marginTop: secondaryGap - gap }, secondaryFill ? { backgroundColor: secondaryFill } : null]} /> : null}
    </View>
  )
}

const IosSheet = (props: Props) => {
  const frame = useSafeAreaFrame()
  const [height, setHeight] = useState(0)
  const keyboardUp = useKeyboardHeight() > 0
  const float = props.full ? null : floatingSheet(frame.width, Platform.Version, HOME_INSET, keyboardUp)
  return (
    <SafeAreaProvider initialMetrics={{ frame, insets: NO_INSETS }} style={{ flex: props.full ? 1 : 0 }}>
      <View
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={
          float
            ? {
                width: float.width,
                alignSelf: 'center',
                transformOrigin: 'top',
                transform: [{ scale: float.scale }],
                marginBottom: height ? float.marginBottom(height) : 0,
              }
            : { flex: props.full ? 1 : undefined }
        }
      >
        <SheetSurface.Provider value={!props.full}>
          <Body {...props} homeInset={HOME_INSET} />
        </SheetSurface.Provider>
      </View>
    </SafeAreaProvider>
  )
}

const Sheet = Platform.OS === 'android' ? Body : IosSheet

export default Sheet

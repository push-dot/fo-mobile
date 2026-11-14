import { useNavigation } from 'expo-router'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Platform, useWindowDimensions, View, type ViewProps } from 'react-native'
import { initialWindowMetrics, SafeAreaProvider, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, useColors } from '../../theme'
import Button from './button'
import { GRABBER } from './constants'
import { SheetSurface } from './glass'
import { floatingSheet } from './sheet-scale'
import { useKeyboardHeight } from './use-keyboard-height'
import GlassButton from './glass-button'
import Text from './text'
import { mountSheet, sizeSheet } from './toast-store'

type Props = {
  title?: string
  description?: string
  children: ReactNode
  action?: { label: string; onPress: () => void; disabled?: boolean }
  secondary?: { label: string; onPress: () => void }
  /** iOS only: a glass close button left of the title. Android closes by drag or back. */
  onClose?: () => void
  gap?: number
  /** Extra space above the action: the boards add 6 (filters) or 4 (quick starts) to the sheet gap. */
  actionGap?: number
  /** iOS filter sheets (.ifoot .btn): a 52 high CTA with 26 under it instead of 56 with 20, the same 78 of footer. */
  slimAction?: boolean
  onLayout?: ViewProps['onLayout']
  /** Drawn to the top of the screen (route with fullSheetOptions): fills the sheet and keeps the CTA at the bottom. */
  full?: boolean
  /**
   * iOS: a sheet as tall as the screen allows. UIKit attaches it full width and does not shrink its content, so it takes no float scale;
   * the board's floating sheet insets its 16 of padding by 8, which the 24 here puts back (FilterRegion). The content is a screen tall so the sheet always reaches that height.
   */
  attached?: boolean
}

const SHEET_GAP = 14
// .ifoot .btn is 52 high (radius 26) and the sheet ends 26 under it: 4 less than the shared 56, 6 more below.
const SLIM_ACTION = { minHeight: 52, borderRadius: 26 } as const
const SLIM_ACTION_BOTTOM = 6
const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 }
// The window's, not the sheet's: a sheet over the tab bar reads the tab bar into its bottom inset (83 for 34).
const HOME_INSET = initialWindowMetrics?.insets.bottom ?? 0

const Body = ({ title, description, children, action, secondary, onClose, gap = SHEET_GAP, actionGap, slimAction, onLayout, full, attached, homeInset = 0 }: Props & { homeInset?: number }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const android = Platform.OS === 'android'
  const id = useId()
  const closing = useRef(false)
  const navigation = useNavigation<{ addListener: (type: 'beforeRemove', listener: () => void) => () => void }>()
  // Leaves the toast stack when the close starts, so a toast shown on confirm lands where it stays.
  useEffect(() => {
    if (!android) return
    const close = mountSheet(id, Platform.OS)
    const sub = navigation.addListener('beforeRemove', () => {
      closing.current = true
      close()
    })
    return () => (sub(), close())
  }, [android, id, navigation])
  const close = onClose && !android ? <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} /> : null
  return (
    <View
      onLayout={(e) => {
        if (android && !closing.current) sizeSheet(id, e.nativeEvent.layout.height)
        onLayout?.(e)
      }}
      style={{
        flex: full ? 1 : undefined,
        paddingTop: android ? spacing[3] : spacing[3] + GRABBER.ios.height + gap,
        paddingHorizontal: android || full ? spacing[5] : attached ? spacing[6] : spacing[4],
        paddingBottom: android
          ? insets.bottom + spacing[3]
          : full
            ? homeInset + spacing[3]
            : (insets.bottom || (homeInset ? 0 : spacing[5])) + (slimAction ? SLIM_ACTION_BOTTOM : 0),
        gap,
      }}
    >
      {android ? (
        <View style={{ ...GRABBER.android, backgroundColor: c.deco, alignSelf: 'center' }} />
      ) : null}
      {title || close ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          {close}
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
      {action ? <Button label={action.label} onPress={action.onPress} disabled={action.disabled} style={[full ? { marginTop: 'auto' } : actionGap ? { marginTop: actionGap } : null, slimAction && SLIM_ACTION]} /> : null}
      {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} /> : null}
    </View>
  )
}

// iOS 26 floats partial sheets clear of the home indicator and attaches large ones; a provider inside the sheet reads which.
// A floating sheet already sits one home inset above its content, so the body pads only without a home indicator.
const IosSheet = (props: Props) => {
  const frame = useSafeAreaFrame()
  const [height, setHeight] = useState(0)
  const keyboardUp = useKeyboardHeight() > 0
  const screenHeight = useWindowDimensions().height
  const float = props.full || props.attached ? null : floatingSheet(frame.width, Platform.Version, HOME_INSET, keyboardUp)
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
            : { flex: props.full ? 1 : undefined, minHeight: props.attached ? screenHeight : undefined }
        }
      >
        <SheetSurface.Provider value={!props.full}>
          <Body {...props} homeInset={HOME_INSET} />
        </SheetSurface.Provider>
      </View>
    </SafeAreaProvider>
  )
}

/** Body of a native form sheet route (see sheetOptions). iOS draws the grabber; Android gets the Material 3 drag handle. */
const Sheet = Platform.OS === 'android' ? Body : IosSheet

export default Sheet

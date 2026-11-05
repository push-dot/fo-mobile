import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, useColors } from '../../theme'
import Button from './button'
import GlassButton from './glass-button'
import Text from './text'

type Props = {
  title?: string
  description?: string
  children: ReactNode
  action?: { label: string; onPress: () => void; disabled?: boolean }
  secondary?: { label: string; onPress: () => void }
  /** iOS only: a glass close button left of the title. Android closes by drag or back. */
  onClose?: () => void
  gap?: number
}

const GRAB = { width: 36, height: 5, radius: 3 }
const SHEET_GAP = 14

/** Body of a native form sheet route (see sheetOptions). iOS draws the grabber; Android gets the Material 3 drag handle. */
const Sheet = ({ title, description, children, action, secondary, onClose, gap = SHEET_GAP }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const android = Platform.OS === 'android'
  const close = onClose && !android ? <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} /> : null
  return (
    <View
      style={{
        paddingTop: android ? spacing[3] : spacing[3] + GRAB.height + gap,
        paddingHorizontal: android ? spacing[5] : spacing[4],
        paddingBottom: android ? insets.bottom + spacing[3] : Math.max(insets.bottom, spacing[5]),
        gap,
      }}
    >
      {android ? (
        <View style={{ width: GRAB.width, height: GRAB.height, borderRadius: GRAB.radius, backgroundColor: c.deco, alignSelf: 'center' }} />
      ) : null}
      {title || close ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          {close}
          {title ? (
            <View style={{ flex: 1, gap: 2 }}>
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
      {action ? <Button label={action.label} onPress={action.onPress} disabled={action.disabled} /> : null}
      {secondary ? <Button label={secondary.label} variant="secondary" onPress={secondary.onPress} /> : null}
    </View>
  )
}

export default Sheet

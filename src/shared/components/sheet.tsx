import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../../theme'
import Button from './button'
import Text from './text'

type Props = {
  title?: string
  description?: string
  children: ReactNode
  action?: { label: string; onPress: () => void; disabled?: boolean }
}

/** Body of a native form sheet route (see sheetOptions). iOS draws the grabber; Android gets the Material 3 drag handle. */
const Sheet = ({ title, description, children, action }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const android = Platform.OS === 'android'
  return (
    <View style={{ paddingTop: android ? 16 : 28, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 16), gap: 14 }}>
      {android ? <View style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: c.deco, alignSelf: 'center', marginBottom: 4 }} /> : null}
      {title ? (
        <View style={{ gap: 2 }}>
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
      {children}
      {action ? <Button label={action.label} onPress={action.onPress} disabled={action.disabled} /> : null}
    </View>
  )
}

export default Sheet

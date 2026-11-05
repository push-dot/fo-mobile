import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, useColors } from '../../theme'
import GlassButton from './glass-button'
import Text from './text'

type Props = {
  title?: string
  left?: ReactNode
  onBack?: () => void
  right?: ReactNode
  safeTop?: boolean
}

const ios = Platform.OS === 'ios'
const EDGE = ios ? spacing[3] : spacing[2]

const TopBar = ({ title, left, onBack, right, safeTop = true }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: safeTop ? insets.top : 0, backgroundColor: c.bg, zIndex: 3 }}>
      <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingLeft: onBack ? EDGE : spacing[5], paddingRight: EDGE, gap: 2 }}>
        {onBack ? <GlassButton actions={[{ icon: 'back', label: '뒤로', onPress: onBack }]} /> : null}
        {left ? <View style={{ flex: 1 }}>{left}</View> : null}
        {title ? (
          <Text v="h3" numberOfLines={1} accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
            {title}
          </Text>
        ) : null}
        {!left && !title ? <View style={{ flex: 1 }} /> : null}
        <View style={{ minWidth: onBack ? 44 : 0, flexDirection: 'row', justifyContent: 'flex-end', gap: ios ? spacing[2] : 2 }}>{right}</View>
      </View>
    </View>
  )
}

export default TopBar

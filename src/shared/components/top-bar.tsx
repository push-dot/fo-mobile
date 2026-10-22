import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../../theme'
import GlassButton from './glass-button'
import Text from './text'

type Props = {
  title?: string
  left?: ReactNode
  onBack?: () => void
  right?: ReactNode
}

const TopBar = ({ title, left, onBack, right }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: c.bg, zIndex: 3 }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingLeft: onBack ? 8 : 20, paddingRight: 8, gap: 2 }}>
        {onBack ? <GlassButton actions={[{ icon: 'back', label: '뒤로', onPress: onBack }]} /> : null}
        {left ? <View style={{ flex: 1 }}>{left}</View> : null}
        {title ? (
          <Text v="h3" numberOfLines={1} accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
            {title}
          </Text>
        ) : null}
        {!left && !title ? <View style={{ flex: 1 }} /> : null}
        <View style={{ minWidth: onBack ? 44 : 0, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>{right}</View>
      </View>
    </View>
  )
}

export default TopBar

import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../theme'
import { GlassButton } from './GlassButton'
import { Text } from './Text'

type Props = {
  /** Centered title (detail screens) */
  title?: string
  /** Left-aligned large label, e.g. the "Push." wordmark on 홈 */
  left?: ReactNode
  onBack?: () => void
  right?: ReactNode
}

/** 56px top bar under the status bar. Back is a glass circle on iOS. */
export function TopBar({ title, left, onBack, right }: Props) {
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

/** "Push." wordmark: Pretendard 800 with a violet full stop. */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <Text v="h1" style={{ fontSize: size, lineHeight: size * 1.3 }}>
      Push<Text v="h1" color="ac" style={{ fontSize: size, lineHeight: size * 1.3 }}>.</Text>
    </Text>
  )
}

import { brandColor } from '@push/shared'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { onAccent, radius, useColors } from '../../../theme'

const LOGO_RADIUS: Record<number, number> = { 44: 14, 48: 15, 56: 16 }

/** `mono`: the proposal boards draw the sender's company tile black like a person's avatar. */
const Logo = ({ name, size = 48, mono }: { name: string; size?: number; mono?: boolean }) => {
  const c = useColors()
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: LOGO_RADIUS[size] ?? radius.sm,
        backgroundColor: mono ? c.t1 : brandColor(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text v={size >= 56 ? 'h2' : 'h3'} weight="800" style={{ color: mono ? c.bg : onAccent }}>
        {[...name][0]}
      </Text>
    </View>
  )
}

export default Logo

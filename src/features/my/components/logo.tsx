import { View } from 'react-native'
import { Text } from '@/shared/components'
import { onAccent, radius } from '../../../theme'
import { tintOf } from '../utils'

const LOGO_RADIUS: Record<number, number> = { 44: 14, 48: 15, 56: 16 }

const Logo = ({ name, size = 48 }: { name: string; size?: number }) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: LOGO_RADIUS[size] ?? radius.sm,
        backgroundColor: tintOf(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text v={size >= 56 ? 'h2' : 'h3'} weight="800" style={{ color: onAccent }}>
        {[...name][0]}
      </Text>
    </View>
  )
}

export default Logo

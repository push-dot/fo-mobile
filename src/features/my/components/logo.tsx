import { View } from 'react-native'
import { Text } from '@/shared/components'
import { tintOf } from '../utility'

const Logo = ({ name, size = 48 }: { name: string; size?: number }) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.31),
        backgroundColor: tintOf(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        weight="800"
        style={{
          color: '#FFFFFF',
          fontSize: Math.round(size * 0.375),
          lineHeight: Math.round(size * 0.5),
        }}
      >
        {[...name][0]}
      </Text>
    </View>
  )
}

export default Logo

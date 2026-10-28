import { Image } from 'expo-image'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { assetUrl } from '@/shared/utility'
import { givenName, tintOf } from '../utils'

const Avatar = ({
  name,
  url,
  size = 48,
}: {
  name: string
  url?: string | null
  size?: number
}) => {
  return url ? (
    <Image
      source={{ uri: assetUrl(url) }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tintOf(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        weight="700"
        style={{
          color: '#FFFFFF',
          fontSize: Math.round(size * 0.31),
          lineHeight: Math.round(size * 0.4),
        }}
      >
        {givenName(name)}
      </Text>
    </View>
  )
}

export default Avatar

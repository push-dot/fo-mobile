import { Image } from 'expo-image'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { useColors } from '../../../theme'
import { assetUrl } from '@/shared/utility'
import { avatarTextSize, givenName } from '../utils'

const Avatar = ({
  name,
  url,
  size = 48,
}: {
  name: string
  url?: string | null
  size?: number
}) => {
  const c = useColors()
  return url ? (
    <Image
      source={{ uri: assetUrl(url) }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      cachePolicy="memory-disk"
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.t1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        weight="700"
        style={{
          color: c.bg,
          fontSize: avatarTextSize(size),
          lineHeight: Math.round(size * 0.4),
        }}
      >
        {givenName(name)}
      </Text>
    </View>
  )
}

export default Avatar

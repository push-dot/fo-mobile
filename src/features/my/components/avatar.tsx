import { brandColor } from '@push/shared'
import { Image } from 'expo-image'
import { View } from 'react-native'
import { Text } from '@/shared/components'
import { onAccent } from '../../../theme'
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
        backgroundColor: brandColor(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        weight="700"
        style={{
          color: onAccent,
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

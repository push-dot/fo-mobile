import { Image } from 'expo-image'
import { View } from 'react-native'
import type { UserRef } from '@push/api-client'
import { Text } from '../../../shared/components'
import { assetUrl } from '../../../shared/utility'
import { fontFor, useColors } from '../../../theme'
import { givenName } from '../utils'

const Avatar = ({ user, size }: { user: UserRef; size: number }) => {
  const c = useColors()
  if (user.avatarUrl) {
    return (
      <Image
        source={assetUrl(user.avatarUrl)}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        cachePolicy="memory-disk"
        accessibilityIgnoresInvertColors
      />
    )
  }
  return (
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
      <Text style={[{ color: c.bg, fontSize: Math.round(size * 0.36), lineHeight: size }, fontFor('700')]}>
        {givenName(user.displayName)}
      </Text>
    </View>
  )
}

export default Avatar

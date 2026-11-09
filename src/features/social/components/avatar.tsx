import { Image } from 'expo-image'
import { View } from 'react-native'
import type { UserRef } from '@push/api-client'
import { brandColor } from '@push/shared'
import { Text } from '../../../shared/components'
import { assetUrl } from '../../../shared/utility'
import { fontFor, onAccent } from '../../../theme'
import { givenName } from '../utils'

const Avatar = ({ user, size }: { user: UserRef; size: number }) => {
  if (user.avatarUrl) {
    return <Image source={assetUrl(user.avatarUrl)} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityIgnoresInvertColors />
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: brandColor(user.displayName),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={[{ color: onAccent, fontSize: Math.round(size * 0.36), lineHeight: size }, fontFor('700')]}>
        {givenName(user.displayName)}
      </Text>
    </View>
  )
}

export default Avatar

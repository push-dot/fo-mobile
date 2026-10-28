import { Image } from 'expo-image'
import { View } from 'react-native'
import type { UserRef } from '@push/api-client'
import { Text } from '../../../shared/components'
import { assetUrl } from '../../../shared/utility'
import { fontFor } from '../../../theme'
import { AVATAR_COLORS } from '../constants'
import { givenName } from '../utils'

const Avatar = ({ user, size }: { user: UserRef; size: number }) => {
  if (user.avatarUrl) {
    return <Image source={assetUrl(user.avatarUrl)} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityIgnoresInvertColors />
  }
  const hash = [...user.id].reduce((h, ch) => h + ch.charCodeAt(0), 0)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: AVATAR_COLORS[hash % AVATAR_COLORS.length],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={[{ color: '#FFFFFF', fontSize: Math.round(size * 0.36), lineHeight: size }, fontFor('700')]}>
        {givenName(user.displayName)}
      </Text>
    </View>
  )
}

export default Avatar

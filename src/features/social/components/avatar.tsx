import { Image } from 'expo-image'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { UserRef } from '@push/api-client'
import { Text } from '../../../shared/components'
import { assetUrl } from '../../../shared/utility'
import { fontFor } from '../../../theme'
import { givenName } from '../utils'

const Avatar = ({ user, size }: { user: UserRef; size: number }) => {
  if (user.avatarUrl) {
    return <Image source={assetUrl(user.avatarUrl)} style={styles.image(size)} cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
  }
  return (
    <View style={styles.fallback(size)}>
      <Text style={styles.initial(size)}>{givenName(user.displayName)}</Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  image: (size: number) => ({ width: size, height: size, borderRadius: size / 2 }),
  fallback: (size: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: theme.colors.t1,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  initial: (size: number) => ({ color: theme.colors.bg, fontSize: Math.round(size * 0.36), lineHeight: size, ...fontFor('700') }),
}))

export default Avatar

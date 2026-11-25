import { Image } from 'expo-image'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
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
}) =>
  url ? (
    <Image source={{ uri: assetUrl(url) }} style={styles.image(size)} cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
  ) : (
    <View style={styles.fallback(size)}>
      <Text weight="700" style={styles.initial(size)}>
        {givenName(name)}
      </Text>
    </View>
  )

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
  initial: (size: number) => ({ color: theme.colors.bg, fontSize: avatarTextSize(size), lineHeight: Math.round(size * 0.4) }),
}))

export default Avatar

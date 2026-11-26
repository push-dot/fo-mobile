import { Image } from 'expo-image'
import { View } from 'react-native'
import { Text } from '../../../shared/components'
import { assetUrl, givenName } from '../../../shared/utility'
import { StyleSheet } from 'react-native-unistyles'

const Avatar = ({ name, url, size }: { name: string; url?: string | null; size: number }) => {
  if (url) return <Image source={assetUrl(url)} style={styles.box(size)} recyclingKey={url} cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
  return (
    <View style={[styles.box(size), styles.fallback]}>
      <Text weight="700" style={styles.initial(size)}>
        {givenName(name)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  box: (size: number) => ({ width: size, height: size, borderRadius: size / 2 }),
  fallback: { backgroundColor: theme.colors.t1, alignItems: 'center', justifyContent: 'center' },
  initial: (size: number) => ({ color: theme.colors.bg, fontSize: size / 3, lineHeight: size / 2.2 }),
}))

export default Avatar

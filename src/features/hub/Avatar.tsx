import { Image } from 'expo-image'
import { View } from 'react-native'
import { assetUrl } from '../../lib/config'
import { Text } from '../../ui'
import { givenName } from './filters'

// Board avatar fills; no theme token exists for per-person colors.
const FILLS = ['#3B5BDB', '#0C8599', '#E8590C', '#5F3DC4', '#2F9E44']

const fillFor = (id: string) => FILLS[[...id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % FILLS.length]!

/** Round avatar: photo when present, otherwise the given name on a stable color. */
export function Avatar({ userId, name, url, size }: { userId: string; name: string; url?: string | null; size: number }) {
  const box = { width: size, height: size, borderRadius: size / 2 }
  if (url) return <Image source={assetUrl(url)} style={box} accessibilityIgnoresInvertColors />
  return (
    <View style={[box, { backgroundColor: fillFor(userId), alignItems: 'center', justifyContent: 'center' }]}>
      <Text weight="700" style={{ color: '#FFFFFF', fontSize: size / 3, lineHeight: size / 2.2 }}>
        {givenName(name)}
      </Text>
    </View>
  )
}

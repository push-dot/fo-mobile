import { Image } from 'expo-image'
import { View } from 'react-native'
import { Text } from '../../../shared/components'
import { assetUrl } from '../../../shared/utility'
import { FILLS } from '../constants'
import { givenName } from '../utility'

const fillFor = (id: string) => FILLS[[...id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % FILLS.length]!

const Avatar = ({ userId, name, url, size }: { userId: string; name: string; url?: string | null; size: number }) => {
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

export default Avatar

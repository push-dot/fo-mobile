import { brandColor } from '@push/shared'
import { Image } from 'expo-image'
import { View } from 'react-native'
import { Text } from '../../../shared/components'
import { assetUrl } from '../../../shared/utility'
import { onAccent } from '../../../theme'
import { givenName } from '../utils'

const Avatar = ({ name, url, size }: { name: string; url?: string | null; size: number }) => {
  const box = { width: size, height: size, borderRadius: size / 2 }
  if (url) return <Image source={assetUrl(url)} style={box} cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
  return (
    <View style={[box, { backgroundColor: brandColor(name), alignItems: 'center', justifyContent: 'center' }]}>
      <Text weight="700" style={{ color: onAccent, fontSize: size / 3, lineHeight: size / 2.2 }}>
        {givenName(name)}
      </Text>
    </View>
  )
}

export default Avatar

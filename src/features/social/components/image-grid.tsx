import { Image } from 'expo-image'
import { View } from 'react-native'
import { assetUrl } from '../../../shared/utility'
import { useColors } from '../../../theme'

const ImageGrid = ({ urls, row }: { urls: string[]; row: number }) => {
  const c = useColors()
  const n = Math.min(urls.length, 4)
  if (!n) return null
  const img = (i: number, style: object) => (
    <Image
      key={i}
      source={assetUrl(urls[i])}
      contentFit="cover"
      accessibilityIgnoresInvertColors
      style={[{ borderRadius: 14, backgroundColor: c.fill2 }, style]}
    />
  )
  const full = row * 2 + 4
  if (n === 1) return img(0, { height: full })
  if (n === 2)
    return (
      <View style={{ flexDirection: 'row', gap: 4, height: Math.round(row * 1.6) }}>
        {img(0, { flex: 1 })}
        {img(1, { flex: 1 })}
      </View>
    )
  if (n === 3)
    return (
      <View style={{ flexDirection: 'row', gap: 4, height: full }}>
        {img(0, { flex: 2 })}
        <View style={{ flex: 1, gap: 4 }}>
          {img(1, { flex: 1 })}
          {img(2, { flex: 1 })}
        </View>
      </View>
    )
  return (
    <View style={{ gap: 4 }}>
      {[0, 2].map((r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 4, height: row }}>
          {img(r, { flex: 1 })}
          {img(r + 1, { flex: 1 })}
        </View>
      ))}
    </View>
  )
}

export default ImageGrid

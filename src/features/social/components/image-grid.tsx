import { Image } from 'expo-image'
import { View, type StyleProp, type ImageStyle } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { assetUrl } from '../../../shared/utility'

const ImageGrid = ({ urls, row }: { urls: string[]; row: number }) => {
  const n = Math.min(urls.length, 4)
  if (!n) return null
  const img = (i: number, style: StyleProp<ImageStyle>) => (
    <Image
      key={i}
      source={assetUrl(urls[i])}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={urls[i]}
      accessibilityIgnoresInvertColors
      style={[styles.image, style]}
    />
  )
  const full = row * 2 + 4
  if (n === 1) return img(0, styles.single(full))
  if (n === 2)
    return (
      <View style={styles.row(Math.round(row * 1.6))}>
        {img(0, styles.flex1)}
        {img(1, styles.flex1)}
      </View>
    )
  if (n === 3)
    return (
      <View style={styles.row(full)}>
        {img(0, styles.flex2)}
        <View style={styles.column}>
          {img(1, styles.flex1)}
          {img(2, styles.flex1)}
        </View>
      </View>
    )
  return (
    <View style={styles.grid}>
      {[0, 2].map((r) => (
        <View key={r} style={styles.row(row)}>
          {img(r, styles.flex1)}
          {img(r + 1, styles.flex1)}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  image: { borderRadius: 14, backgroundColor: theme.colors.fill2 },
  single: (height: number) => ({ width: '100%', height }),
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  row: (height: number) => ({ flexDirection: 'row', gap: theme.spacing[1], height }),
  column: { flex: 1, gap: theme.spacing[1] },
  grid: { gap: theme.spacing[1] },
}))

export default ImageGrid

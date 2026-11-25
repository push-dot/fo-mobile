import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Posting } from '@push/api-client'
import { brandColor, cardCareerLabel } from '@push/shared'
import { hitSlopTo, photo, useColors } from '../../theme'
import { assetUrl } from '../utility'
import Icon from './icon'
import Text from './text'

const shade = (hex: string) => `#${[1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.55).toString(16).padStart(2, '0')).join('')}`

type Props = {
  posting: Posting
  width?: number
  onPress?: () => void
  onPressIn?: () => void
  onBookmark?: () => void
}

const JobCard = ({ posting: p, width = 200, onPress, onPressIn, onBookmark }: Props) => {
  const c = useColors()
  const brand = brandColor(p.company)
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${p.company} ${p.title}`} onPress={onPress} onPressIn={onPressIn} style={styles.card(width)}>
      <View style={styles.media(Math.round((width * 136) / 200))}>
        {p.imageUrl ? (
          <Image source={{ uri: assetUrl(p.imageUrl) }} recyclingKey={p.id} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <>
            <LinearGradient colors={[brand, shade(brand)]} start={{ x: 0.13, y: -0.16 }} end={{ x: 0.87, y: 1.16 }} style={styles.cover} />
            <Text v="h1" style={styles.initial}>
              {[...p.company][0]}
            </Text>
          </>
        )}
        <LinearGradient colors={['transparent', photo.shade]} style={styles.shade} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={p.bookmarked ? '북마크 해제' : '북마크'}
          accessibilityState={{ selected: p.bookmarked }}
          onPress={onBookmark}
          hitSlop={hitSlopTo(30)}
          style={styles.bookmark}
        >
          <Icon name="bookmark" size={16} color={p.bookmarked ? c.acText : c.t1} filled={p.bookmarked} />
        </Pressable>
      </View>
      <View style={styles.meta}>
        <Text v="c1" weight="600" color="t3" numberOfLines={1}>
          {p.company}
        </Text>
        <Text v="b1" weight="700" numberOfLines={1}>
          {p.title}
        </Text>
        <Text v="c2" color="t3" numberOfLines={1}>
          {p.location} · {cardCareerLabel(p)}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  card: (width: number) => ({ width, gap: 10 }),
  media: (height: number) => ({ height, borderRadius: theme.radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }),
  cover: { position: 'absolute', inset: 0 },
  initial: { fontSize: 52, lineHeight: 76, color: photo.ink, letterSpacing: -2 },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 },
  bookmark: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 30,
    height: 30,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.bg,
    boxShadow: '0 1px 4px rgba(0,0,0,.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { gap: 2 },
}))

export default JobCard

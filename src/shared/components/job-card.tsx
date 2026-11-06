import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { Pressable, View } from 'react-native'
import type { Posting } from '@push/api-client'
import { brandOf, cardCareerLabel } from '@push/shared'
import { hitSlopTo, palette, photo, radius } from '../../theme'
import { assetUrl } from '../utility'
import Icon from './icon'
import Text from './text'

// CSS color-mix(in srgb, brand 55%, #000), the cover gradient's end stop.
const shade = (hex: string) => `#${[1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.55).toString(16).padStart(2, '0')).join('')}`

type Props = {
  posting: Posting
  width?: number
  onPress?: () => void
  onBookmark?: () => void
}

const JobCard = ({ posting: p, width = 200, onPress, onBookmark }: Props) => {
  const brand = brandOf(p.company)
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${p.company} ${p.title}`} onPress={onPress} style={{ width, gap: 10 }}>
      <View style={{ height: Math.round((width * 136) / 200), borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {p.imageUrl ? (
          <Image source={{ uri: assetUrl(p.imageUrl) }} style={{ position: 'absolute', inset: 0 }} contentFit="cover" />
        ) : (
          <>
            <LinearGradient colors={[brand, shade(brand)]} start={{ x: 0.13, y: -0.16 }} end={{ x: 0.87, y: 1.16 }} style={{ position: 'absolute', inset: 0 }} />
            <Text v="h1" style={{ fontSize: 52, lineHeight: 60, color: photo.ink, letterSpacing: -2 }}>
              {[...p.company][0]}
            </Text>
          </>
        )}
        <LinearGradient colors={['transparent', photo.shade]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={p.bookmarked ? '북마크 해제' : '북마크'}
          accessibilityState={{ selected: p.bookmarked }}
          onPress={onBookmark}
          hitSlop={hitSlopTo(30)}
          style={{ position: 'absolute', right: 8, bottom: 8, width: 30, height: 30, borderRadius: radius.pill, backgroundColor: photo.button, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="bookmark" size={16} color={p.bookmarked ? palette.light.acText : palette.light.t1} filled={p.bookmarked} />
        </Pressable>
      </View>
      <View style={{ gap: 2 }}>
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

export default JobCard

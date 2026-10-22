import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { Pressable, View } from 'react-native'
import type { Posting } from '@push/api-client'
import { radius } from '../../theme'
import { assetUrl, brandOf, careerLabel } from '../utility'
import Icon from './icon'
import Text from './text'

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
            <LinearGradient colors={[brand, `${brand}B3`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
            <Text v="h1" style={{ fontSize: 52, lineHeight: 60, color: 'rgba(255,255,255,0.92)' }}>
              {[...p.company][0]}
            </Text>
          </>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.28)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={p.bookmarked ? '북마크 해제' : '북마크'}
          accessibilityState={{ selected: p.bookmarked }}
          onPress={onBookmark}
          hitSlop={8}
          style={{ position: 'absolute', right: 8, bottom: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.86)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="bookmark" size={16} color={p.bookmarked ? '#4A3BDF' : '#16191D'} filled={p.bookmarked} />
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
          {p.location} · {careerLabel(p)}
        </Text>
      </View>
    </Pressable>
  )
}

export default JobCard

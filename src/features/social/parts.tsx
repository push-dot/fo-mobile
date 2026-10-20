import type { Post, UserRef } from '@push/api-client'
import { POST_CATEGORIES } from '@push/api-client'
import { Image } from 'expo-image'
import { View } from 'react-native'
import { assetUrl } from '../../lib/config'
import { fontFor, useColors } from '../../theme'
import { Text } from '../../ui'
import { givenName, timeAgo } from './lib'

// Per-person avatar colors from the boards (no theme tokens exist for these).
const AVATAR_COLORS = ['#1971C2', '#D6336C', '#2F9E44', '#E8590C', '#C2255C', '#5B4CF0', '#0C8599']

export const categoryLabel = (key: Post['category']) => POST_CATEGORIES.find((c) => c.key === key)?.label ?? ''

export function Avatar({ user, size }: { user: UserRef; size: number }) {
  if (user.avatarUrl) {
    return <Image source={assetUrl(user.avatarUrl)} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityIgnoresInvertColors />
  }
  const hash = [...user.id].reduce((h, ch) => h + ch.charCodeAt(0), 0)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: AVATAR_COLORS[hash % AVATAR_COLORS.length],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={[{ color: '#FFFFFF', fontSize: Math.round(size * 0.36), lineHeight: size }, fontFor('700')]}>
        {givenName(user.displayName)}
      </Text>
    </View>
  )
}

/** Avatar + 작성자 + "카테고리 · 시간". */
export function AuthorRow({ post, size }: { post: Post; size: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Avatar user={post.author} size={size} />
      <View>
        <Text v="b2" weight="700">
          {post.author.displayName}
        </Text>
        <Text v="c2" color="t3">
          {categoryLabel(post.category)} · {timeAgo(post.createdAt)}
        </Text>
      </View>
    </View>
  )
}

/** 1–4 images. 3 = big left + two stacked, matching the boards. `row` is one grid row's height. */
export function ImageGrid({ urls, row }: { urls: string[]; row: number }) {
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

/** Gray 10px band between posts. */
export function Band({ style }: { style?: object }) {
  const c = useColors()
  return <View style={[{ height: 10, backgroundColor: c.bg2 }, style]} />
}

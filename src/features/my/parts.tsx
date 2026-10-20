import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Platform, Pressable, View } from 'react-native'
import { api } from '../../lib/api'
import { assetUrl } from '../../lib/config'
import { radius, useColors } from '../../theme'
import { Glass, GlassButton, Icon, Text, TopBar } from '../../ui'
import { givenName, tintOf } from './lib'

/** Circle avatar with the given name on a colour, or the photo. */
export function Avatar({
  name,
  url,
  size = 48,
}: {
  name: string
  url?: string | null
  size?: number
}) {
  return url ? (
    <Image
      source={{ uri: assetUrl(url) }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tintOf(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        weight="700"
        style={{
          color: '#FFFFFF',
          fontSize: Math.round(size * 0.31),
          lineHeight: Math.round(size * 0.4),
        }}
      >
        {givenName(name)}
      </Text>
    </View>
  )
}

/** Rounded square company tile with the initial. */
export function Logo({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.31),
        backgroundColor: tintOf(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        weight="800"
        style={{
          color: '#FFFFFF',
          fontSize: Math.round(size * 0.375),
          lineHeight: Math.round(size * 0.5),
        }}
      >
        {[...name][0]}
      </Text>
    </View>
  )
}

/** "내 서류 3개" style list heading. */
export function ListTitle({
  title,
  count,
  top = 14,
}: {
  title: string
  count?: number
  top?: number
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingTop: top,
        paddingBottom: 4,
        paddingHorizontal: 20,
      }}
    >
      <Text v="h2" accessibilityRole="header">
        {title}
      </Text>
      {count !== undefined ? (
        <Text v="c1" weight="600" color="t3">
          {count}개
        </Text>
      ) : null}
    </View>
  )
}

/** Unread received offers, shown on the 제안함 button. */
export const useUnreadOffers = () =>
  useQuery({
    queryKey: ['me', 'offers', 'received', 'unread'],
    queryFn: () => api.me.offers('received', { limit: 50 }),
    select: (r) => r.data.filter((o) => !o.readAt).length,
  })

/** 마이 top bar: large title + glass 제안함 (unread badge) and 설정 buttons. */
export function MyHeader() {
  const { data: unread = 0 } = useUnreadOffers()
  return (
    <TopBar
      left={
        <Text v="h1" accessibilityRole="header" style={{ fontSize: 26, lineHeight: 32 }}>
          마이
        </Text>
      }
      right={
        <>
          <GlassButton
            actions={[
              {
                icon: 'inbox',
                label: unread ? `받은 제안 ${unread}개` : '제안함',
                badge: unread,
                onPress: () => router.push('/offers'),
              },
            ]}
          />
          <GlassButton
            actions={[{ icon: 'gear', label: '설정', onPress: () => router.push('/settings') }]}
          />
        </>
      }
    />
  )
}

/** Header for the section edit sheets: 닫기 · title · 저장. */
export function SheetHeader({
  title,
  onSave,
  saving,
  canSave = true,
}: {
  title: string
  onSave: () => void
  saving?: boolean
  canSave?: boolean
}) {
  const c = useColors()
  const disabled = saving || !canSave
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
      }}
    >
      <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
      <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, busy: saving }}
        disabled={disabled}
        onPress={onSave}
        style={{
          height: 44,
          borderRadius: 22,
          paddingHorizontal: 18,
          backgroundColor: c.ac,
          justifyContent: 'center',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <Text v="c1" weight="700" style={{ color: '#FFFFFF', fontSize: 14 }}>
          {saving ? '저장 중' : '저장'}
        </Text>
      </Pressable>
    </View>
  )
}

/** Field label above an input (c1 bold t3). */
export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text v="c1" weight="700" color="t3" style={{ paddingLeft: 4 }}>
      {children}
    </Text>
  )
}

/** Bottom toast with a green check ("이력서 파일을 올렸어요"). Hides itself after 2.5s. */
export function Toast({ text, onHide }: { text: string | null; onHide: () => void }) {
  const c = useColors()
  useEffect(() => {
    if (!text) return
    void AccessibilityInfo.announceForAccessibility(text)
    const t = setTimeout(onHide, 2500)
    return () => clearTimeout(t)
  }, [text, onHide])
  if (!text) return null
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: c.green,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="check" size={14} color="#FFFFFF" />
      </View>
      <Text v="b2" weight="600" style={{ color: Platform.OS === 'ios' ? c.t1 : c.bg }}>
        {text}
      </Text>
    </View>
  )
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', left: 20, right: 20, bottom: 24, zIndex: 8 }}
    >
      {Platform.OS === 'ios' ? (
        <Glass style={{ borderRadius: 18 }}>{body}</Glass>
      ) : (
        <View style={{ borderRadius: 18, backgroundColor: c.t1 }}>{body}</View>
      )}
    </View>
  )
}

/** Small state for a toast message. */
export const useToast = () => {
  const [text, setText] = useState<string | null>(null)
  const hide = useCallback(() => setText(null), [])
  return { text, show: setText, hide }
}

/** Empty/hint line for lists. */
export function Empty({ text }: { text: string }) {
  return (
    <Text
      v="b2"
      color="t3"
      style={{ textAlign: 'center', paddingVertical: 48, paddingHorizontal: 20 }}
    >
      {text}
    </Text>
  )
}

/** Hairline-free 14/20 padded row used across 마이 lists. */
export function Row({
  children,
  onPress,
  label,
  top,
}: {
  children: ReactNode
  onPress?: () => void
  label?: string
  top?: boolean
}) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: top ? 'flex-start' : 'center',
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: pressed ? c.fill : 'transparent',
        borderRadius: radius.xs,
      })}
    >
      {children}
    </Pressable>
  )
}

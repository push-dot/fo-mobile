import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Alert, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../../lib/api'
import { useColors } from '../../theme'
import { GlassButton, Icon, Text } from '../../ui'
import { send } from './store'

/** Company logo (rounded square) or person avatar (circle) with an initial on a brand color. */
export function Mark({ text, color, size = 44, round }: { text: string; color: string; size?: number; round?: boolean }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: round ? size / 2 : Math.round(size * 0.31), backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text weight={round ? '700' : '800'} style={{ color: '#FFFFFF', fontSize: round ? size * 0.32 : size * 0.38, lineHeight: size * 0.5 }}>
        {text}
      </Text>
    </View>
  )
}

/** Creates the conversation, opens it (tab bar hides) and sends the first message. */
export function useStartChat() {
  const qc = useQueryClient()
  return async (title: string, message: string, attachment?: string, replace?: boolean) => {
    try {
      const conv = await api.conversations.create(title.slice(0, 300))
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      if (replace) router.replace(`/chat/${conv.id}`)
      else router.push(`/chat/${conv.id}`)
      send(conv.id, message, attachment)
    } catch {
      Alert.alert('대화를 시작하지 못했어요', '잠시 뒤에 다시 해 주세요.')
    }
  }
}

/** "10분 전", "어제", "10월 16일". */
export const ago = (iso: string) => {
  const d = new Date(iso)
  const min = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  if (min < 60 * 24) return `${Math.floor(min / 60)}시간 전`
  if (min < 60 * 48) return '어제'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/**
 * Near-full-height modal (계정, 내 서류, 내 링크, 북마크한 공고): ✕ top-left, centered title.
 * iOS uses the native page sheet; Android a full-screen slide.
 */
export function PageModal({
  visible,
  onClose,
  title,
  right,
  left,
  children,
  footer,
}: {
  visible: boolean
  onClose: () => void
  title: string
  right?: ReactNode
  /** Replaces ✕ (요금제 page shows back). */
  left?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle={ios ? 'pageSheet' : 'fullScreen'}>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: ios ? 14 : insets.top + 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 6 }}>
          {left ?? <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />}
          <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
            {title}
          </Text>
          <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 + (footer ? 80 : 0) }}>{children}</ScrollView>
        {footer ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 14, paddingBottom: insets.bottom + 10, backgroundColor: c.bg }}>{footer}</View> : null}
      </View>
    </Modal>
  )
}

/** 12px t3 footnote under lists (.gnote). */
export const Note = ({ children }: { children: string }) => (
  <Text v="c2" color="t3" style={{ paddingHorizontal: 24, paddingTop: 14, lineHeight: 17 }}>
    {children}
  </Text>
)

/** 13px bold t3 group title (.gt). */
export const GroupTitle = ({ children, count }: { children: string; count?: number }) => (
  <Text v="c1" weight="700" color="t3" style={{ paddingTop: 18, paddingBottom: 2 }}>
    {children}
    {count !== undefined ? <Text v="c1" weight="700" color="t4">{` ${count}`}</Text> : null}
  </Text>
)

/** 22px radio (inset ring) or checkbox (rounded square with check). */
export function Pick({ on, square }: { on: boolean; square?: boolean }) {
  const c = useColors()
  if (square)
    return (
      <View style={{ width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ac : 'transparent', borderWidth: on ? 0 : 2, borderColor: c.t4 }}>
        {on ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
      </View>
    )
  return <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: on ? 7 : 2, borderColor: on ? c.ac : c.t4 }} />
}

/** Row that only needs a press affordance; keeps ≥44 hit target. */
export function Row({ children, onPress, label, style }: { children: ReactNode; onPress?: () => void; label?: string; style?: object }) {
  const c = useColors()
  if (!onPress) return <View style={style}>{children}</View>
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [{ minHeight: 44 }, style, pressed && { backgroundColor: c.fill }]}>
      {children}
    </Pressable>
  )
}

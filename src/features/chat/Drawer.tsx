import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Animated, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../../theme'
import { Badge, GlassButton, Icon, Text, type IconName } from '../../ui'
import { AccountModal } from './AccountModal'
import { chatApi, type ConversationRow } from './api'
import { BookmarksModal } from './BookmarksModal'
import { DocsModal } from './DocsModal'
import { LinksModal } from './LinksModal'
import { SPRING, useReduceMotion } from './motion'
import { useMe } from './useMe'
import { ago, Mark } from './parts'

type Sheet = 'account' | 'docs' | 'links' | 'bookmarks' | null

export const statusBadge = (s: ConversationRow['status']) =>
  s === 'NEEDS_APPROVAL' ? <Badge label="확인 필요" tone="orange" /> : s === 'RUNNING' ? <Badge label="작업 중" tone="ac" /> : null

/** Full-width slide bar over the tab bar (ChatDrawer). `currentId` is set inside a conversation. */
export function ChatDrawer({ visible, onClose, currentId }: { visible: boolean; onClose: () => void; currentId?: string }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const reduce = useReduceMotion()
  const x = useState(() => new Animated.Value(0))[0]
  const [sheet, setSheet] = useState<Sheet>(null)
  const me = useMe()
  const account = useQuery({ queryKey: ['chat', 'account'], queryFn: chatApi.account, enabled: visible })
  const recent = useQuery({ queryKey: ['conversations', 'recent'], queryFn: () => chatApi.conversations({ limit: 4 }), enabled: visible })

  useEffect(() => {
    if (visible) {
      x.setValue(0)
      Animated.timing(x, { toValue: 1, duration: reduce ? 200 : 380, easing: SPRING, useNativeDriver: true }).start()
    }
  }, [visible, x, reduce])

  const open = (id: string) => {
    onClose()
    if (id === currentId) return
    if (currentId) router.replace(`/chat/${id}`)
    else router.push(`/chat/${id}`)
  }
  const newChat = () => {
    onClose()
    if (currentId) router.dismissTo('/chat')
  }

  const menu: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'edit', label: '새 대화', onPress: newChat },
    { icon: 'doc', label: '내 서류', onPress: () => setSheet('docs') },
    { icon: 'link', label: '내 링크', onPress: () => setSheet('links') },
    { icon: 'bookmark', label: '북마크한 공고', onPress: () => setSheet('bookmarks') },
  ]

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: c.bg,
          paddingTop: insets.top,
          opacity: reduce ? x : 1,
          transform: reduce ? [] : [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 60, paddingLeft: 14, paddingRight: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${me.name}, 계정 열기`}
            onPress={() => setSheet('account')}
            style={({ pressed }) => ({ flex: 1, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingLeft: 6, paddingRight: 16, borderRadius: 28, backgroundColor: pressed ? c.fill : 'transparent' })}
          >
            <Mark text={me.given} color="#3B5BDB" size={40} round />
            <View>
              <Text v="b1" weight="700">
                {me.name}
              </Text>
              <Text v="c2" color="t3">
                {account.data?.plan ?? ' '}
              </Text>
            </View>
          </Pressable>
          <GlassButton actions={[{ icon: 'side', label: '사이드바 닫기', onPress: onClose }]} />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 6, paddingTop: 12, paddingBottom: insets.bottom + 10 }}>
          <View style={{ gap: 4 }}>
            {menu.map((m) => (
              <Pressable
                key={m.label}
                accessibilityRole="button"
                onPress={m.onPress}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 7, height: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: pressed ? c.fill : 'transparent' })}
              >
                <View style={{ width: 21, alignItems: 'center' }}>
                  <Icon name={m.icon} size={20} color="t2" />
                </View>
                <Text v="b1" weight="500" style={{ fontSize: 17 }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 10, marginHorizontal: 14 }} />
          <Text v="c1" weight="700" color="t3" style={{ paddingTop: 10, paddingHorizontal: 14, paddingBottom: 6 }}>
            최근 대화
          </Text>
          {recent.data?.data.map((cv) => (
            <Pressable
              key={cv.id}
              accessibilityRole="button"
              onPress={() => open(cv.id)}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: pressed || cv.id === currentId ? c.fill : 'transparent' })}
            >
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {cv.title}
                  </Text>
                  {statusBadge(cv.status)}
                </View>
                {cv.lastLine ? (
                  <Text v="c1" color="t3" numberOfLines={1}>
                    {cv.lastLine}
                  </Text>
                ) : null}
              </View>
              <Text v="c2" color="t3">
                {ago(cv.updatedAt)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => (onClose(), router.push('/conversations'))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 12, paddingHorizontal: 14, minHeight: 44 }}
          >
            <Text v="b2" weight="600" color="t2">
              모두 보기
            </Text>
            <Icon name="chev" size={16} color="t2" />
          </Pressable>
        </ScrollView>

        <AccountModal visible={sheet === 'account'} onClose={() => setSheet(null)} />
        <DocsModal visible={sheet === 'docs'} onClose={() => setSheet(null)} />
        <LinksModal visible={sheet === 'links'} onClose={() => setSheet(null)} onUse={() => (setSheet(null), onClose())} />
        <BookmarksModal visible={sheet === 'bookmarks'} onClose={() => setSheet(null)} onDone={() => (setSheet(null), onClose())} />
      </Animated.View>
    </Modal>
  )
}

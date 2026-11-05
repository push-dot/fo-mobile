import { router, usePathname } from 'expo-router'
import { useDrawerStatus } from 'expo-router/drawer'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../../../theme'
import { GlassButton, Icon, Text, type IconName } from '@/shared/components'
import { AccountModal } from './account-modal'
import { useChatAccount, useMe, useRecentConversations } from '../api/hooks'
import { BookmarksModal } from './bookmarks-modal'
import { ConversationsModal, statusBadge } from './conversations-modal'
import { DocsModal } from './docs-modal'
import { LinksModal } from './links-modal'
import Mark from './mark'
import { ago } from '../utils'

type Sheet = 'account' | 'docs' | 'links' | 'bookmarks' | 'list' | null

/** Content of the app drawer (see app/(app)/_layout.tsx): full-width chat sidebar over the tab bar. */
export const ChatSidebar = ({ onClose }: { onClose: () => void }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const visible = useDrawerStatus() === 'open'
  const currentId = usePathname().match(/^\/chat\/([^/]+)$/)?.[1]
  const [sheet, setSheet] = useState<Sheet>(null)
  const me = useMe()
  const account = useChatAccount(visible)
  const recent = useRecentConversations(visible)

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
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          height: 60,
          paddingLeft: 14,
          paddingRight: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${me.name}, 계정 열기`}
          onPress={() => setSheet('account')}
          style={({ pressed }) => ({
            flex: 1,
            marginRight: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 6,
            paddingLeft: 6,
            paddingRight: 16,
            borderRadius: 28,
            backgroundColor: pressed ? c.fill : 'transparent',
          })}
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
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 6,
          paddingTop: 12,
          paddingBottom: insets.bottom + 10,
        }}
      >
        <View style={{ gap: 4 }}>
          {menu.map((m) => (
            <Pressable
              key={m.label}
              accessibilityRole="button"
              onPress={m.onPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
                height: 44,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: pressed ? c.fill : 'transparent',
              })}
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
        <View
          style={{ height: 1, backgroundColor: c.line, marginVertical: 10, marginHorizontal: 14 }}
        />
        <Text
          v="c1"
          weight="700"
          color="t3"
          style={{ paddingTop: 10, paddingHorizontal: 14, paddingBottom: 6 }}
        >
          최근 대화
        </Text>
        {recent.data?.data.map((cv) => (
          <Pressable
            key={cv.id}
            accessibilityRole="button"
            onPress={() => open(cv.id)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 16,
              backgroundColor: pressed || cv.id === currentId ? c.fill : 'transparent',
            })}
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
          accessibilityLabel="최근 대화 모두 보기"
          onPress={() => (onClose(), setSheet('list'))}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            paddingVertical: 12,
            paddingHorizontal: 14,
            minHeight: 44,
          }}
        >
          <Text v="b2" weight="600" color="t2">
            모두 보기
          </Text>
          <Icon name="chev" size={16} color="t2" />
        </Pressable>
      </ScrollView>

      <AccountModal visible={sheet === 'account'} onClose={() => setSheet(null)} />
      <DocsModal visible={sheet === 'docs'} onClose={() => setSheet(null)} />
      <LinksModal
        visible={sheet === 'links'}
        onClose={() => setSheet(null)}
        onUse={() => (setSheet(null), onClose())}
      />
      <BookmarksModal
        visible={sheet === 'bookmarks'}
        onClose={() => setSheet(null)}
        onDone={() => (setSheet(null), onClose())}
      />
      <ConversationsModal
        visible={sheet === 'list'}
        onClose={() => setSheet(null)}
        currentId={currentId}
        onDeleted={currentId ? () => router.dismissTo('/chat') : undefined}
      />
    </View>
  )
}

import { router, usePathname } from 'expo-router'
import { useDrawerStatus } from 'expo-router/drawer'
import { Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tintOf } from '@/features/my'
import { radius, spacing, useColors } from '@/theme'
import { GlassButton, Icon, Text, type IconName } from '@/shared/components'
import { useChatAccount, useMe, useRecentConversations } from '../api/hooks'
import { statusBadge } from './conversations-modal'
import Mark from './mark'
import { accountPath, ago, bookmarksPath, conversationsPath, docsPath, linksPath } from '../utils'


/** Content of the app drawer (see app/(app)/_layout.tsx): full-width chat sidebar over the tab bar. */
export const ChatSidebar = ({ onClose }: { onClose: () => void }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const visible = useDrawerStatus() === 'open'
  const currentId = usePathname().match(/^\/chat\/([^/]+)$/)?.[1]
  const me = useMe()
  const account = useChatAccount(visible)
  const recent = useRecentConversations(visible)

  const open = (id: string) => {
    onClose()
    if (id === currentId) return
    if (currentId) router.replace(`/chat/${id}`)
    else router.push(`/chat/${id}`)
  }
  // iOS presents the page sheet over the open sidebar; on Android the drawer would cover the stack's modal.
  const page = (href: Parameters<typeof router.push>[0]) => {
    if (Platform.OS === 'android') onClose()
    router.push(href)
  }
  const newChat = () => {
    onClose()
    if (currentId) router.dismissTo('/chat')
  }

  const menu: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'edit', label: '새 대화', onPress: newChat },
    { icon: 'doc', label: '내 서류', onPress: () => page(docsPath()) },
    { icon: 'link', label: '내 링크', onPress: () => page(linksPath()) },
    { icon: 'bookmark', label: '북마크한 공고', onPress: () => page(bookmarksPath()) },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[2],
          height: 60,
          paddingLeft: spacing[4],
          paddingRight: spacing[3],
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${me.name}, 계정 열기`}
          onPress={() => page(accountPath())}
          style={({ pressed }) => ({
            flex: 1,
            marginRight: spacing[2],
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
            paddingVertical: spacing[2],
            paddingLeft: spacing[2],
            paddingRight: spacing[4],
            borderRadius: radius.xl,
            backgroundColor: pressed ? c.fill : 'transparent',
          })}
        >
          <Mark text={me.given} color={tintOf(me.name)} size={40} round />
          <View>
            <Text v="b1" weight="700">
              {me.name}
            </Text>
            <Text v="c2" color="t3">
              {account.data?.plan ?? ' '}
            </Text>
          </View>
        </Pressable>
        <GlassButton actions={[{ icon: 'sidebar-close', label: '사이드바 닫기', onPress: onClose }]} />
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 6,
          paddingTop: spacing[3],
          paddingBottom: insets.bottom + 10,
        }}
      >
        <View style={{ gap: spacing[1] }}>
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
                borderRadius: radius.sm,
                backgroundColor: pressed ? c.fill : 'transparent',
              })}
            >
              <View style={{ width: 21, alignItems: 'center' }}>
                <Icon name={m.icon} size={20} color="t2" />
              </View>
              <Text v="h3" weight="500">
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {recent.data?.data.length ? (
          <>
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
            {recent.data.data.map((cv) => (
              <Pressable
                key={cv.id}
                accessibilityRole="button"
                onPress={() => open(cv.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: spacing[3],
                  paddingHorizontal: 14,
                  borderRadius: radius.md,
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
              onPress={() => (onClose(), router.push(conversationsPath(currentId)))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2,
                paddingVertical: spacing[3],
                paddingHorizontal: 14,
                minHeight: 44,
              }}
            >
              <Text v="b2" weight="600" color="t2">
                모두 보기
              </Text>
              <Icon name="chev" size={16} color="t2" />
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

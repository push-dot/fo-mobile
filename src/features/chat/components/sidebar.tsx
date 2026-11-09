import { brandColor } from '@push/shared'
import { router } from 'expo-router'
import { Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, spacing, useColors, useShadow } from '@/theme'
import { GlassButton, Icon, Text, type IconName } from '@/shared/components'
import { useChatAccount, useMe, useRecentConversations } from '../api/hooks'
import { statusBadge } from './conversations-modal'
import Mark from './mark'
import { useLeaveSidebar } from '../hooks'
import { accountPath, ago, bookmarksPath, conversationsPath, docsPath, linksPath } from '../utils'


// Android draws the collapse button as a 48pt white disc with a 1pt ring outside it.
const CLOSE_DISC = 48

/** Full-screen chat sidebar, a stack route that slides in from the left (app/(app)/(stack)/sidebar/index.tsx). */
export const ChatSidebar = ({ currentId }: { currentId?: string }) => {
  const c = useColors()
  const shadow = useShadow()
  const insets = useSafeAreaInsets()
  const leave = useLeaveSidebar()
  const me = useMe()
  const account = useChatAccount(true)
  const recent = useRecentConversations(true)

  const onClose = () => router.back()
  const open = (id: string) => {
    if (id === currentId) return onClose()
    leave(() => (currentId ? router.replace(`/chat/${id}`) : router.push(`/chat/${id}`)))
  }
  const newChat = () => (currentId ? router.dismissTo('/chat') : onClose())

  const menu: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'edit', label: '새 대화', onPress: newChat },
    { icon: 'doc', label: '내 서류', onPress: () => router.push(docsPath()) },
    { icon: 'link', label: '내 링크', onPress: () => router.push(linksPath()) },
    { icon: 'bookmark', label: '북마크한 공고', onPress: () => router.push(bookmarksPath()) },
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
          onPress={() => router.push(accountPath())}
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
          <Mark text={me.given} color={brandColor(me.name)} size={40} round />
          <View>
            <Text v="b1" weight="700">
              {me.name}
            </Text>
            <Text v="c2" color="t3">
              {account.data?.plan ?? ' '}
            </Text>
          </View>
        </Pressable>
        <View style={Platform.OS === 'android' ? [{ width: CLOSE_DISC + 2, height: CLOSE_DISC + 2, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: c.line }, shadow.glass] : undefined}>
          <View style={Platform.OS === 'android' ? { width: CLOSE_DISC, height: CLOSE_DISC, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg } : undefined}>
            <GlassButton iconSize={24} actions={[{ icon: 'sidebar-close', label: '사이드바 닫기', onPress: onClose }]} />
          </View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[2],
          paddingTop: spacing[4],
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
                gap: spacing[2],
                height: 44,
                paddingHorizontal: spacing[4],
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
              style={{ paddingTop: spacing[3], paddingHorizontal: spacing[4], paddingBottom: spacing[2] }}
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
                  gap: spacing[3],
                  paddingVertical: spacing[3],
                  paddingHorizontal: spacing[4],
                  borderRadius: radius.md,
                  backgroundColor: pressed || cv.id === currentId ? c.fill : 'transparent',
                })}
              >
                <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
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
              onPress={() => router.push(conversationsPath(currentId))}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[1],
                paddingVertical: spacing[3],
                paddingHorizontal: spacing[4],
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

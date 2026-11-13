import { brandColor } from '@push/shared'
import { router } from 'expo-router'
import { Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, spacing, useColors, useShadow } from '@/theme'
import { GlassButton, Icon, Text, type IconName } from '@/shared/components'
import { useChatAccount, useMe } from '../api/hooks'
import Mark from './mark'
import { accountPath, bookmarksPath, docsPath, linksPath } from '../utils'


// Android draws the collapse button as a 48pt white disc with a 1pt ring outside it.
const CLOSE_DISC = 48

/** Full-screen chat sidebar, a stack route that slides in from the left (app/(app)/(stack)/sidebar/index.tsx). */
export const ChatSidebar = ({ currentId }: { currentId?: string }) => {
  const c = useColors()
  const shadow = useShadow()
  const insets = useSafeAreaInsets()
  const me = useMe()
  const account = useChatAccount(true)

  const onClose = () => router.back()
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
      </ScrollView>
    </View>
  )
}

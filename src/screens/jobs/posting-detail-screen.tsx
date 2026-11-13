import { router } from 'expo-router'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { botChatPath, botNewPath, findBotForPosting } from '@/features/bots'
import { postingShareMessage, usePosting, useToggleBookmark } from '@/features/jobs'
import { Button, DetailWebView, GlassButton, TopBar } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { spacing, useColors } from '@/theme'

const PostingDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { data: p } = usePosting(id)
  const toggleBookmark = useToggleBookmark()
  const android = Platform.OS === 'android'
  const barBottom = insets.bottom + (android ? 10 : 6)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        onBack={() => router.back()}
        right={
          p ? (
            <GlassButton
              actions={[
                { icon: 'bookmark', label: p.bookmarked ? '북마크 해제' : '북마크', active: p.bookmarked, onPress: () => toggleBookmark(p) },
                { icon: 'share', label: '공유', onPress: () => void shareMessage({ message: postingShareMessage(p.id, p) }) },
              ]}
            />
          ) : null
        }
      />
      <DetailWebView path={`/postings/${encodeURIComponent(id)}`} />
      <View
        style={{
          flexDirection: 'row',
          gap: spacing[2],
          paddingTop: 14,
          paddingHorizontal: spacing[4],
          paddingBottom: barBottom,
          backgroundColor: c.bg,
          borderTopWidth: android ? 1 : 0,
          borderTopColor: c.line,
        }}
      >
        <Button
          label="봇으로 맞추기"
          variant="secondary"
          onPress={() => {
            void findBotForPosting(id).then(
              (bot) => router.push(bot ? botChatPath(bot.id) : botNewPath(id)),
              () => router.push(botNewPath(id)),
            )
          }}
        />
        <Button
          label={p?.applied ? '지원 완료' : '지원하기'}
          disabled={!p || p.applied}
          onPress={() => router.push({ pathname: '/apply', params: { postingId: id } })}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  )
}

export default PostingDetailScreen

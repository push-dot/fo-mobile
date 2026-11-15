import { router } from 'expo-router'
import { View } from 'react-native'
import { botChatPath, botNewPath, findBotForPosting } from '@/features/bots'
import { postingShareMessage, usePosting, useToggleBookmark } from '@/features/jobs'
import { Button, CtaBar, DetailWebView, GlassButton, TopBar, type DetailFrom } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { useColors } from '@/theme'

const PostingDetailScreen = ({ id, from }: { id: string; from?: DetailFrom }) => {
  const c = useColors()
  const { data: p } = usePosting(id)
  const toggleBookmark = useToggleBookmark()

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
      <DetailWebView path={`/postings/${encodeURIComponent(id)}`} from={from} />
      <CtaBar>
        <Button
          label="Bot한테 보내기"
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
      </CtaBar>
    </View>
  )
}

export default PostingDetailScreen

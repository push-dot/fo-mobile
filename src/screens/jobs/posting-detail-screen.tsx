import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { postingShareMessage, usePosting, useToggleBookmark } from '@/features/jobs'
import { Button, DetailWebView, GlassButton, TopBar } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { useColors } from '@/theme'

const PostingDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [title, setTitle] = useState<string>()
  const { data: p } = usePosting(id)
  const toggleBookmark = useToggleBookmark()
  const android = Platform.OS === 'android'
  const barBottom = insets.bottom + (android ? 10 : 6)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title={title}
        onBack={() => router.back()}
        right={
          <GlassButton
            actions={[
              { icon: 'bookmark', label: p?.bookmarked ? '북마크 해제' : '북마크', active: p?.bookmarked, onPress: () => p && toggleBookmark(p) },
              {
                icon: 'share',
                label: '공유',
                onPress: () => void shareMessage({ message: postingShareMessage(id, p) }),
              },
            ]}
          />
        }
      />
      <DetailWebView path={`/postings/${encodeURIComponent(id)}`} onTitle={setTitle} />
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingTop: 14,
          paddingHorizontal: 16,
          paddingBottom: barBottom,
          backgroundColor: c.bg,
          borderTopWidth: android ? 1 : 0,
          borderTopColor: c.line,
        }}
      >
        <Button
          label="에이전트로 맞추기"
          variant="secondary"
          icon={android ? 'spark' : undefined}
          onPress={() => router.push({ pathname: '/(tabs)/(chat)/chat', params: { postingId: id } })}
        />
        <Button
          label={p?.applied ? '지원 완료' : '지원하기'}
          icon={android ? 'paper' : undefined}
          disabled={!p || p.applied}
          onPress={() => router.push({ pathname: '/apply', params: { postingId: id } })}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  )
}

export default PostingDetailScreen

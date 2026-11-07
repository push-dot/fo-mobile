import { router } from 'expo-router'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePosting } from '@/features/jobs'
import { Button, DetailWebView, TopBar } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const PostingDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { data: p } = usePosting(id)
  const android = Platform.OS === 'android'
  const barBottom = insets.bottom + (android ? 10 : 6)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
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
          label="에이전트로 맞추기"
          variant="secondary"
          onPress={() => router.push({ pathname: '/(app)/(stack)/(tabs)/(chat)/chat', params: { postingId: id } })}
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

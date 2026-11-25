import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { botPickPath } from '@/features/bots'
import { postingShareMessage, usePosting, useToggleBookmark } from '@/features/jobs'
import { Button, CtaBar, DetailWebView, FloatingHeader, NativeTopBar, useFloatingHeader, useNativeTopBarInset, type DetailFrom } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { StyleSheet } from 'react-native-unistyles'

const CTA_HEIGHT = 14 + 56 + 6

const PostingDetailScreen = ({ id, from }: { id: string; from?: DetailFrom }) => {
  const { data: p } = usePosting(id)
  const toggleBookmark = useToggleBookmark()
  const floating = useFloatingHeader()
  const { onHeight } = floating
  const inset = useNativeTopBarInset(floating.inset)
  const [offset, setOffset] = useState(0)
  const { top, bottom } = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      <DetailWebView path={`/postings/${encodeURIComponent(id)}`} from={from} inset={{ top: inset + top, bottom: CTA_HEIGHT + bottom }} onScroll={setOffset} />
      <FloatingHeader scrolled={offset > 0} onHeight={onHeight}>
      <NativeTopBar
        transparent
        onBack={() => router.back()}
        actions={
          p
            ? [
                { icon: 'bookmark', label: p.bookmarked ? '북마크 해제' : '북마크', active: p.bookmarked, onPress: () => toggleBookmark(p) },
                { icon: 'share', label: '공유', onPress: () => void shareMessage({ message: postingShareMessage(p.id, p) }) },
              ]
            : undefined
        }
      />
      </FloatingHeader>
      <CtaBar light>
        <Button
          label="Bot한테 보내기"
          variant="secondary"
          onPress={() => router.push(botPickPath({ kind: 'posting', id }))}
        />
        <Button
          label={p?.applied ? '지원 완료' : '지원하기'}
          disabled={!p}
          pending={p?.applied}
          onPress={() => router.push({ pathname: '/apply', params: { postingId: id } })}
          style={styles.flex}
        />
      </CtaBar>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  flex: { flex: 1 },
}))

export default PostingDetailScreen

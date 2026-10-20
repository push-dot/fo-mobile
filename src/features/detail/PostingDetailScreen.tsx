import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { Platform, Share, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../../lib/api'
import { WEB_BASE_URL } from '../../lib/config'
import { useColors } from '../../theme'
import { Button, GlassButton, TopBar } from '../../ui'
import { ApplySheet } from '../jobs/ApplySheet'
import { useToggleBookmark } from '../jobs/queries'
import { DetailWebView } from './DetailWebView'
import { Toast } from './Toast'

/** 채용공고 상세 (feature-spec 3.4): fo-web body + native toolbar and bottom bar. */
export function PostingDetailScreen({ id }: { id: string }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [title, setTitle] = useState<string>()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [toast, setToast] = useState(false)
  const hideToast = useCallback(() => setToast(false), [])
  // ['postings', …] so useToggleBookmark's invalidation refreshes the saved state here too.
  const { data: p } = useQuery({ queryKey: ['postings', 'detail', id], queryFn: () => api.postings.get(id) })
  const toggleBookmark = useToggleBookmark()
  const done = applied || !!p?.applied
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
                onPress: () => void Share.share({ message: `${p ? `${p.company} · ${p.title}\n` : ''}${p?.sourceUrl ?? `${WEB_BASE_URL}/postings/${id}`}` }),
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
          label="AI로 맞추기"
          variant="secondary"
          icon={android ? 'spark' : undefined}
          onPress={() => router.push({ pathname: '/(tabs)/(chat)/chat', params: { postingId: id } })}
        />
        <Button
          label={done ? '지원 완료' : '지원하기'}
          icon={android ? 'paper' : undefined}
          disabled={done || !p}
          onPress={() => setApplying(true)}
          style={{ flex: 1 }}
        />
      </View>
      {toast ? <Toast text="지원했어요. 내 활동에서 진행 상황을 볼 수 있어요" bottom={barBottom + 86} onHide={hideToast} /> : null}
      {p ? (
        <ApplySheet
          postingId={id}
          company={p.company}
          title={p.title}
          visible={applying}
          onClose={() => setApplying(false)}
          onApplied={() => {
            setApplying(false)
            setApplied(true)
            setToast(true)
          }}
        />
      ) : null}
    </View>
  )
}

import { router } from 'expo-router'
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EMPLOYMENT_TYPES, workConditionLines } from '@push/api-client'
import { careerLabel } from '@push/shared'
import { postingShareMessage, useToggleBookmark } from '@/features/jobs'
import {
  FitRing,
  fitTen,
  INTERVIEW_PREP,
  Logo,
  PostingSection,
  StageTracker,
  useDocuments,
  useMyApplications,
  usePostingDetail,
} from '@/features/my'
import { Badge, Button, GlassButton, Icon, Text, TopBar } from '@/shared/components'
import { openBrowser, shareMessage } from '@/shared/infrastructure'
import { useColors } from '@/theme'

const ApplicationDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { data, isLoading } = useMyApplications()
  const item = data?.data.find((a) => a.id === id)
  const { data: p } = usePostingDetail(item?.jobId)
  const docs = useDocuments()
  const toggleBookmark = useToggleBookmark()
  const doc = docs.data?.data.find((d) => d.applicationId === id)
  const android = Platform.OS === 'android'
  const career = p ? careerLabel(p) : null
  const score = fitTen(item?.fitScore)

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
      {isLoading || !item ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 32, gap: 24 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Logo name={item.company} size={40} />
              <Text v="b2" weight="700">
                {item.company}
              </Text>
            </View>
            <Text v="h1" accessibilityRole="header">
              {item.title}
            </Text>
            {p ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Badge label={p.location} />
                {career ? <Badge label={career === '신입' ? career : `경력 ${career}`} /> : null}
                <Badge label={EMPLOYMENT_TYPES.find((t) => t.key === p.employmentType)?.label ?? ''} />
              </View>
            ) : null}
          </View>
          <StageTracker a={item} />
          {score ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: 20, backgroundColor: c.bg2 }}>
              <FitRing score={score} size={56} />
              <Text v="c1" weight="700" color="t3">
                내 적합도
              </Text>
            </View>
          ) : null}
          {p ? (
            <>
              <PostingSection title="하는 일" items={p.description.split('\n').map((s) => s.trim()).filter(Boolean)} />
              <PostingSection title="자격 요건" items={p.requirements} />
              <PostingSection title="우대 사항" items={p.preferred ?? []} />
              <PostingSection title="근무 조건" items={workConditionLines(p.workConditions)} />
            </>
          ) : null}
          {p?.sourceUrl ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void openBrowser(p.sourceUrl!)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
            >
              <Icon name="ext" size={16} color="t3" />
              <Text v="c1" weight="600" color="t2">
                원문 보기 · {item.company} 채용 사이트
              </Text>
              <Icon name="chev" size={14} color="t4" />
            </Pressable>
          ) : null}
        </ScrollView>
      )}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingTop: 14,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + (android ? 10 : 6),
          backgroundColor: c.bg,
          borderTopWidth: android ? 1 : 0,
          borderTopColor: c.line,
        }}
      >
        <Button label="지원한 서류" variant="secondary" disabled={!doc} onPress={() => doc && router.push(`/docs/push/${doc.id}`)} />
        <Button label={INTERVIEW_PREP} onPress={() => router.push('/(app)/(stack)/(tabs)/(chat)/chat')} style={{ flex: 1 }} />
      </View>
    </View>
  )
}

export default ApplicationDetailScreen

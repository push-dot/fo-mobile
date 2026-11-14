import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { EMPLOYMENT_TYPES, workConditionLines } from '@push/api-client'
import { careerLabel } from '@push/shared'
import { botChatPath, botNewPath, findBotForPosting } from '@/features/bots'
import { postingShareMessage, useToggleBookmark } from '@/features/jobs'
import {
  APPLICATION_LOAD_FAILED,
  AppliedFitCard,
  appliedFit,
  INTERVIEW_PREP,
  ListSkeleton,
  Empty,
  emptyCta,
  Logo,
  RETRY_LABEL,
  PostingSection,
  StageTracker,
  useApplication,
  useDocuments,
  useMyApplications,
  usePostingDetail,
} from '@/features/my'
import { CtaBar, Badge, Button, GlassButton, Icon, Text, TopBar } from '@/shared/components'
import { openBrowser, shareMessage } from '@/shared/infrastructure'
import { spacing, useColors } from '@/theme'


const ApplicationDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const { data, isLoading } = useMyApplications()
  const item = data?.data.find((a) => a.id === id)
  const detailQuery = useApplication(id)
  const { data: detail, isLoading: detailLoading } = detailQuery
  const { data: p } = usePostingDetail(item?.jobId)
  const docs = useDocuments()
  const toggleBookmark = useToggleBookmark()
  // The résumé of this application; a paged list may not hold it, so the stored fit's document is the fallback.
  const docId = docs.data?.data.find((d) => d.applicationId === id)?.id ?? detail?.fit?.documentId
  const career = p ? careerLabel(p) : null
  const fit = appliedFit(item?.fitScore, detail?.fit)

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
      {isLoading || detailLoading ? (
        <ListSkeleton />
      ) : detailQuery.isError && !detail ? (
        <Empty text={APPLICATION_LOAD_FAILED} action={RETRY_LABEL} onAction={() => void detailQuery.refetch()} />
      ) : !item ? (
        <Empty text={emptyCta('applications').title} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: spacing[1], paddingHorizontal: spacing[5], paddingBottom: 120, gap: spacing[6] }}>
          <View style={{ gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <Logo name={item.company} size={44} />
              <Text v="b2" weight="700">
                {item.company}
              </Text>
            </View>
            <Text v="h1" accessibilityRole="header">
              {item.title}
            </Text>
            {p ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                <Badge label={p.location} />
                {career ? <Badge label={career === '신입' ? career : `경력 ${career}`} /> : null}
                <Badge label={EMPLOYMENT_TYPES.find((t) => t.key === p.employmentType)?.label ?? ''} />
              </View>
            ) : null}
          </View>
          <StageTracker a={detail ?? item} />
          {fit ? (
            <AppliedFitCard
              fit={fit}
              onPress={() => {
                void findBotForPosting(item.jobId).then(
                  (bot) => router.push(bot ? botChatPath(bot.id) : botNewPath(item.jobId)),
                  () => router.push(botNewPath(item.jobId)),
                )
              }}
            />
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
              <Text v="c1" weight="600" color="t3">
                원문 보기 · {item.company} 채용 사이트
              </Text>
              <Icon name="chev" size={14} color="t3" />
            </Pressable>
          ) : null}
        </ScrollView>
      )}
      {item ? (
        <CtaBar>
        <Button label="지원한 서류" variant="secondary" disabled={!docId} onPress={() => docId && router.push(`/docs/push/${docId}`)} />
        <Button label={INTERVIEW_PREP} onPress={() => router.push(botChatPath('push'))} style={{ flex: 1 }} />
        </CtaBar>
      ) : null}
    </View>
  )
}

export default ApplicationDetailScreen

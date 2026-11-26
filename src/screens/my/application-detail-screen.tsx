import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { careerLabel } from '@push/shared'
import { botChatPath, openPostingBot } from '@/features/bots'
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
  postingTitleLines,
  StageTracker,
  useApplication,
  useDocuments,
  useMyApplications,
  usePostingDetail,
  EMPLOYMENT_TYPES,
  workConditionLines,
} from '@/features/my'
import { CtaBar, Badge, Button, Icon, Text, NativeTopBar } from '@/shared/components'
import { openBrowser, shareMessage } from '@/shared/infrastructure'
import { StyleSheet } from 'react-native-unistyles'

const ApplicationDetailScreen = ({ id }: { id: string }) => {
  const { data, isLoading } = useMyApplications()
  const item = data?.data.find((a) => a.id === id)
  const detailQuery = useApplication(id)
  const { data: detail, isLoading: detailLoading } = detailQuery
  const { data: p } = usePostingDetail(item?.jobId)
  const docs = useDocuments()
  const toggleBookmark = useToggleBookmark()
  const docId = docs.data?.data.find((d) => d.applicationId === id)?.id ?? detail?.fit?.documentId
  const career = p ? careerLabel(p) : null
  const employment = EMPLOYMENT_TYPES.find((t) => t.key === p?.employmentType)?.label
  const fit = appliedFit(item?.fitScore, detail?.fit)

  return (
    <View style={styles.screen}>
      <NativeTopBar
        onBack={() => router.back()}
        actions={
          p
            ? [
                {
                  icon: 'bookmark',
                  label: p.bookmarked ? '북마크 해제' : '북마크',
                  active: p.bookmarked,
                  onPress: () => toggleBookmark(p),
                },
                {
                  icon: 'share',
                  label: '공유',
                  onPress: () => void shareMessage({ message: postingShareMessage(p.id, p) }),
                },
              ]
            : undefined
        }
      />
      {isLoading || detailLoading ? (
        <ListSkeleton />
      ) : detailQuery.isError && !detail ? (
        <Empty
          text={APPLICATION_LOAD_FAILED}
          action={RETRY_LABEL}
          onAction={() => void detailQuery.refetch()}
        />
      ) : !item ? (
        <Empty text={emptyCta('applications').title} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.companyRow}>
              <Logo name={item.company} size={44} />
              <Text v="b2" weight="700">
                {item.company}
              </Text>
            </View>
            <Text v="h1" accessibilityRole="header">
              {postingTitleLines(item.title).join('\n')}
            </Text>
            {p ? (
              <View style={styles.badges}>
                <Badge label={p.location} />
                {career ? <Badge label={career === '신입' ? career : `경력 ${career}`} /> : null}
                {employment ? <Badge label={employment} /> : null}
              </View>
            ) : null}
          </View>
          <StageTracker a={detail ?? item} />
          {fit ? <AppliedFitCard fit={fit} onPress={() => openPostingBot(item.jobId)} /> : null}
          {p ? (
            <>
              <PostingSection
                title="하는 일"
                items={p.description
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean)}
              />
              <PostingSection title="자격 요건" items={p.requirements} />
              <PostingSection title="우대 사항" items={p.preferred ?? []} />
              <PostingSection title="근무 조건" items={workConditionLines(p.workConditions)} />
              {p.sourceUrl ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => p.sourceUrl && void openBrowser(p.sourceUrl)}
                  style={styles.sourceLink}
                >
                  <Icon name="ext" size={14} color="t3" />
                  <Text v="c1" weight="600" color="t3">
                    원문 보기 · {item.company} 채용 사이트
                  </Text>
                  <Icon name="chev" size={14} color="t3" />
                </Pressable>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}
      {item ? (
        <CtaBar>
          <Button
            label="지원한 서류"
            variant="secondary"
            disabled={!docId}
            onPress={() => docId && router.push(`/docs/push/${docId}`)}
          />
          <Button
            label={INTERVIEW_PREP}
            onPress={() => router.push(botChatPath('push'))}
            style={styles.primaryCta}
          />
        </CtaBar>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: {
    paddingTop: theme.spacing[1],
    paddingHorizontal: theme.spacing[5],
    paddingBottom: 120,
    gap: theme.spacing[6],
  },
  header: { gap: theme.spacing[3] },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  primaryCta: { flex: 1 },
}))

export default ApplicationDetailScreen

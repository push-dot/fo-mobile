import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native'
import { isJobSettled, JOB_CATEGORIES } from '@push/api-client'
import { useShareFile, useStartChat } from '@/features/chat'
import { usePosting } from '@/features/jobs'
import {
  Avatar,
  careerPeriod,
  deleteConfirm,
  deleteDocCopy,
  FitRing,
  ListSkeleton,
  FIX_DOC,
  hubProfile,
  type ProfileSection,
  PROFILE_ACTIONS_TOP,
  PROFILE_NAME_TOP,
  RETRY_LABEL,
  SHEET_SWAP_MS,
  pushCardLines,
  pushDocMenu,
  SET_BASE_COPY,
  tenureLabel,
  useArchiveDocument,
  useDocument,
  useDocumentVersions,
  useIngestJob,
  useMyApplications,
  useMyProfile,
  useSetBaseProfile,
} from '@/features/my'
import { CtaBar, askConfirm, Badge, Button, GlassButton, Icon, showToast, TOAST_ABOVE, Text, TopBar } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'

const HUB_BADGE = '지원 서류용 프로필(허브형)'

const edit = (s: ProfileSection) => router.push(`/edit-profile/${s}`)

const Section = ({
  title,
  onEdit,
  gap = spacing[2],
  children,
}: {
  title: string
  onEdit?: () => void
  gap?: number
  children: ReactNode
}) => (
  <View style={{ paddingHorizontal: spacing[5], gap }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text v="h3" accessibilityRole="header">
        {title}
      </Text>
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 편집`}
          onPress={onEdit}
          style={{ width: 44, height: 44, margin: -6, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="edit" size={18} color="t3" />
        </Pressable>
      ) : null}
    </View>
    {children}
  </View>
)

const PushDocScreen = ({ id, jobId, sheet }: { id: string; jobId?: string; sheet?: boolean }) => {
  const c = useColors()
  const doc = useDocument(id)
  const versions = useDocumentVersions(id)
  const ingest = useIngestJob(jobId).data
  const making = !!jobId && (!ingest || !isJobSettled(ingest))
  const refetchVersions = versions.refetch
  useEffect(() => {
    if (!making) void refetchVersions()
  }, [making, refetchVersions])
  const apps = useMyApplications()
  const me = useMyProfile().data
  const start = useStartChat()
  const share = useShareFile()
  const deleteCopy = deleteDocCopy(doc.data?.data.title ?? '')
  const archive = useArchiveDocument(doc.data?.data)
  const [based, setBased] = useState(false)
  const setBase = useSetBaseProfile(() => {
    setBased(true)
    showToast({ message: SET_BASE_COPY.toast })
  })
  const item = doc.data?.data
  const application = apps.data?.data.find((a) => a.id === item?.applicationId) ?? null
  const posting = usePosting(application?.jobId ?? '')
  const applied = !!application?.appliedAt || !!posting.data?.applied
  const removeDoc = () => {
    if (archive.isPending) return
    archive.mutate(undefined, {
      onSuccess: () => {
        showToast({ message: deleteCopy.toast })
        router.back()
      },
      onError: () =>
        showToast({
          message: deleteCopy.failed,
          alert: true,
          opaque: true,
          bottom: TOAST_ABOVE.tabs,
          action: { label: RETRY_LABEL, onPress: removeDoc },
        }),
    })
  }
  const menu = pushDocMenu(
    { hasPosting: !!application },
    {
      posting: () => router.push(`/postings/${application?.jobId}`),
      export: () => share.mutate({ documentId: id }),
      rename: () => router.push(`/docs/push/${id}/rename`),
      delete: () => askConfirm(deleteConfirm({ fileName: item?.title ?? '' }, () => setTimeout(removeDoc, SHEET_SWAP_MS))),
    },
  )
  const editable = (s: ProfileSection) => (application ? () => edit(s) : undefined)
  const lines = item ? pushCardLines(item, application) : null
  const version = versions.data?.data[0]
  const profile = hubProfile(version?.content)
  const intro = profile.intro || (version?.blocks ?? []).map((b) => b.text).filter(Boolean).join('\n')
  const job = JOB_CATEGORIES.find((j) => j.key === me?.jobCategory)?.label ?? ''
  const jobLine = [job, tenureLabel(me?.tenureYears ?? null)].filter(Boolean).join(' · ')

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        title={application ? undefined : '지원 서류용 프로필'}
        onBack={() => router.back()}
        right={
          <GlassButton
            actions={[
              { icon: 'share', label: '공유', onPress: () => share.mutate({ documentId: id }) },
              { icon: 'menu', label: '더 보기', menu },
            ]}
          />
        }
        safeTop={!(sheet && Platform.OS === 'ios')}
        sheet={sheet}
      />
      {doc.isLoading || !item || !lines ? (
        <ListSkeleton />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: application ? 120 : spacing[6], gap: spacing[6] }}>
          {application ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${lines.company} ${lines.title} 공고 보기`}
              onPress={() => router.push(`/postings/${application.jobId}`)}
              style={{
                marginHorizontal: spacing[5],
                marginTop: spacing[2],
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: c.line,
                backgroundColor: c.paper,
                paddingVertical: spacing[4],
                paddingLeft: spacing[5],
                paddingRight: spacing[4],
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[4],
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text v="h3" weight="800" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {lines.title}
                  </Text>
                  <Text v="c1" weight="600" color="t2" numberOfLines={1}>
                    {lines.company}
                  </Text>
                </View>
                <Text v="c1" weight="600" color="t2" style={{ marginTop: spacing[1] }}>
                  공고 보기 ›
                </Text>
              </View>
              {lines.score ? <FitRing score={lines.score} /> : null}
            </Pressable>
          ) : null}

          <View style={{ alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: application ? 0 : spacing[1] }}>
            <Avatar name={me?.displayName ?? ''} url={me?.avatarUrl ?? null} size={84} />
            <Text v="h1" style={{ marginTop: PROFILE_NAME_TOP }}>
              {me?.displayName}
            </Text>
            {profile.headline || me?.headline ? (
              <Text v="b2" color="t2" style={{ textAlign: 'center' }}>
                {profile.headline || me?.headline}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[1] }}>
              {jobLine ? <Badge label={jobLine} tone="grey" /> : null}
              {application ? null : <Badge label={HUB_BADGE} tone="ac" />}
            </View>
            {application ? (
              <Button label="기본 정보 편집" icon="edit" variant="secondary" size="sm" onPress={() => edit('basic')} style={{ marginTop: PROFILE_ACTIONS_TOP }} />
            ) : null}
            {application || based ? null : (
              <Button
                label={SET_BASE_COPY.action}
                size="sm"
                disabled={setBase.isPending}
                onPress={() =>
                  askConfirm({
                    title: SET_BASE_COPY.title,
                    body: SET_BASE_COPY.body,
                    confirm: SET_BASE_COPY.confirm,
                    cancel: SET_BASE_COPY.cancel,
                    onConfirm: () => setBase.mutate(id),
                  })
                }
                style={{ marginTop: PROFILE_ACTIONS_TOP }}
              />
            )}
          </View>

          {making ? (
            <View style={{ alignItems: 'center', gap: spacing[2], paddingTop: spacing[5] }}>
              <ActivityIndicator />
              <Text v="b2" color="t3">
                만드는 중
              </Text>
            </View>
          ) : null}

          {intro && !making ? (
            <Section title="소개" onEdit={editable('intro')}>
              <Text v="b2" color="t2">
                {intro}
              </Text>
            </Section>
          ) : null}

          {profile.careers.length ? (
            <Section title="경력" onEdit={editable('career')} gap={spacing[3]}>
              {profile.careers.map((cr, i) => {
                const last = i === profile.careers.length - 1
                return (
                  <View key={`${cr.company}-${i}`} style={{ flexDirection: 'row', gap: spacing[4] }}>
                    <View style={{ alignItems: 'center', paddingTop: spacing[2] }}>
                      <View style={{ width: 10, height: 10, borderRadius: radius.pill, backgroundColor: cr.endedOn ? c.t4 : c.ac }} />
                      {!last ? <View style={{ flex: 1, width: 2, backgroundColor: c.line, marginTop: spacing[1] }} /> : null}
                    </View>
                    <View style={{ flex: 1, paddingBottom: last ? 0 : spacing[3] }}>
                      <Text v="b1" weight="700">
                        {cr.company} · {cr.role}
                      </Text>
                      {cr.startedOn ? (
                        <Text v="c1" color="t3">
                          {careerPeriod({ startedOn: cr.startedOn, endedOn: cr.endedOn })}
                        </Text>
                      ) : null}
                      {cr.description ? (
                        <Text v="b2" color="t2" style={{ marginTop: spacing[1] }}>
                          {cr.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )
              })}
            </Section>
          ) : null}

          {profile.skills.length ? (
            <Section title="기술 스택" onEdit={editable('skills')} gap={spacing[3]}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                {profile.skills.map((s) => (
                  <Badge key={s} label={s} tone="grey" />
                ))}
              </View>
            </Section>
          ) : null}
        </ScrollView>
      )}
      {application ? (
        <CtaBar>
          <Button
            label="에이전트로 고치기"
            icon="spark"
            variant="secondary"
            onPress={() => void start(FIX_DOC, FIX_DOC, undefined, undefined, undefined, { documentId: id })}
          />
          <Button
            label={applied ? '지원 완료' : '이 공고에 지원'}
            icon={applied ? undefined : 'chevron-right-2'}
            disabled={applied}
            onPress={() => router.push({ pathname: '/apply', params: { postingId: application.jobId } })}
            style={{ flex: 1 }}
          />
        </CtaBar>
      ) : null}
    </View>
  )
}

export default PushDocScreen

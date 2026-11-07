import { router } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { isJobSettled } from '@push/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { fileSize, monthDay } from '@push/shared'
import { Button, GlassPressable, Icon, Spinner, TOAST_ABOVE, Text, showToast } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { useDocuments, useIngestJob, useMyApplications, useSources, useUpload } from '../api/hooks'
import { INGEST_TEXT, PUSH_CARD_WIDTH } from '../constants'
import { pickResume, useImportRequest, useUndoRemove } from '../hooks'
import type { HubDocument, MySource } from '../types'
import { PUSH_DOCS_TITLE, pushCardLines, pushSeeAll, RETRY_LABEL, SIZE_LIMIT, UPLOADS_TITLE } from '../utils'
import FitRing from './fit-ring'
import ListTitle from './list-title'
import Row from './row'

const HIT = 44
const RETRY_H = 32
const PROGRESS_H = 6
const EMPTY_ART = 76
const EMPTY_INSET = 40
const EMPTY_BOTTOM = 140

const openChat = () => router.push('/(app)/(stack)/(tabs)/(chat)/chat')

const DocRow = ({ doc }: { doc: MySource }) => {
  const qc = useQueryClient()
  const job = useIngestJob(doc.jobId).data
  const reading = !!doc.jobId && (!job || !isJobSettled(job))
  const failed = doc.status === 'FAILED' || job?.status === 'FAILED' || job?.status === 'DEAD'
  const retry = () => {
    // shortcut: no re-ingest route; refetch the job and the file list.
    void qc.invalidateQueries({ queryKey: ['ai-job', doc.jobId] })
    void qc.invalidateQueries({ queryKey: ['me', 'sources'] })
  }
  return (
    <Row label={doc.fileName} onPress={() => router.push(`/docs/${doc.id}`)}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="700" numberOfLines={1}>
          {doc.fileName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
          <Text v="c1" color="t3">
            {fileSize(doc.size)}
            {doc.createdAt ? ` · ${monthDay(doc.createdAt)}` : ''}
            {reading || failed ? ' · ' : ''}
          </Text>
          {reading && !failed ? <Spinner /> : null}
          {reading || failed ? (
            <Text v="c1" weight="600" color={failed ? 'red' : 'acText'}>
              {failed ? INGEST_TEXT.failed : INGEST_TEXT.reading}
            </Text>
          ) : null}
        </View>
      </View>
      {failed ? (
        <GlassPressable
          accessibilityRole="button"
          onPress={retry}
          style={{ height: RETRY_H, borderRadius: RETRY_H / 2 }}
          contentStyle={{ paddingHorizontal: spacing[3], gap: spacing[1] }}
        >
          <Icon name="retry" size={14} color="t1" />
          <Text v="c1" weight="700">
            {RETRY_LABEL}
          </Text>
        </GlassPressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${doc.fileName} 더 보기`}
        onPress={() => router.push(`/docs/${doc.id}/more`)}
        style={{ width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="menu" size={20} color="t3" />
      </Pressable>
    </Row>
  )
}

const PushCard = ({ doc }: { doc: HubDocument }) => {
  const c = useColors()
  const apps = useMyApplications()
  const application = apps.data?.data.find((a) => a.id === doc.applicationId) ?? null
  const lines = pushCardLines(doc, application)
  const date = monthDay(doc.updatedAt)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[lines.company, lines.title, lines.score && `적합도 10점 만점에 ${lines.score}점`, lines.doc, date].filter(Boolean).join(', ')}
      onPress={() => router.push(`/docs/push/${doc.id}`)}
      style={{ width: PUSH_CARD_WIDTH, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper, padding: spacing[2] }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], paddingTop: spacing[4], paddingHorizontal: spacing[3], paddingBottom: spacing[5] }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text v="h2" weight="800" numberOfLines={1}>
            {lines.title}
          </Text>
          {lines.company ? (
            <Text v="c1" weight="600" color="t2" numberOfLines={1}>
              {lines.company}
            </Text>
          ) : null}
        </View>
        {lines.score ? <FitRing score={lines.score} /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderRadius: radius.card, backgroundColor: c.bg2, padding: spacing[3] }}>
        <Text v="c1" weight="600" numberOfLines={1} style={{ flex: 1 }}>
          {lines.doc}
        </Text>
        {date ? (
          <Text v="c1" color="t2">
            {date}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}

const DocsTab = () => {
  const c = useColors()
  const { data, isLoading } = useSources()
  const push = useDocuments()
  const hidden = useUndoRemove()
  const { upload, start, cancel } = useUpload(() => showToast({ message: '이력서 파일을 올렸어요', tone: 'success', bottom: TOAST_ABOVE.tabs }))
  const pickFile = () => void pickResume().then((file) => file && start(file))
  useImportRequest(pickFile)

  if (isLoading) return <ActivityIndicator style={{ marginTop: 60 }} />
  const docs = (data?.data ?? []).filter((d) => !hidden.includes(d.id))
  const pushDocs = push.data?.data ?? []
  const preview = pushDocs.slice(0, 3)
  if (docs.length === 0 && preview.length === 0 && !upload && !push.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[2],
          paddingHorizontal: EMPTY_INSET,
          paddingBottom: EMPTY_BOTTOM,
        }}
      >
        <View
          style={{
            width: EMPTY_ART,
            height: EMPTY_ART,
            borderRadius: radius.xl,
            backgroundColor: c.acSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[2],
          }}
        >
          <Icon name="doc" size={34} color={c.ac} />
        </View>
        <Text v="h2" style={{ textAlign: 'center' }}>
          아직 등록한 서류가 없어요
        </Text>
        <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
          {'PDF나 DOCX 파일을 올리거나\n에이전트로 새로 만들어 보세요.'}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: spacing[2], marginTop: spacing[4] }}>
          <Button label="파일 등록" onPress={pickFile} />
          <Button label="에이전트로 만들기" variant="secondary" onPress={openChat} />
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: spacing[6] }}>
        {preview.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: spacing[6], paddingBottom: spacing[1], paddingHorizontal: spacing[5] }}>
              <Text v="h2" accessibilityRole="header">
                {PUSH_DOCS_TITLE}
              </Text>
              <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/docs/push')}>
                <Text v="c1" weight="600" color="t2">
                  {pushSeeAll(pushDocs.length)}
                </Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing[2] }} contentContainerStyle={{ gap: spacing[3], paddingHorizontal: spacing[5], paddingTop: 1, paddingBottom: spacing[2] }}>
              {preview.map((d) => (
                <PushCard key={d.id} doc={d} />
              ))}
            </ScrollView>
          </>
        ) : null}
        <ListTitle title={UPLOADS_TITLE} count={docs.length + (upload ? 1 : 0)} top={32} />
        {upload ? (
          <Row>
            <View style={{ flex: 1, minWidth: 0, gap: spacing[2] }}>
              <Text v="b1" weight="700" numberOfLines={1}>
                {upload.name}
              </Text>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(upload.progress * 100) }}
                style={{ height: PROGRESS_H, borderRadius: radius.pill, backgroundColor: c.fill2, overflow: 'hidden' }}
              >
                <View
                  style={{
                    width: `${upload.progress * 100}%`,
                    height: '100%',
                    borderRadius: radius.pill,
                    backgroundColor: c.ac,
                  }}
                />
              </View>
              <Text v="c1" color="t3">
                올리는 중 · {((upload.size * upload.progress) / 1_000_000).toFixed(1)} /{' '}
                {(upload.size / 1_000_000).toFixed(1)}MB
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="취소"
              onPress={cancel}
              style={{ width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="x" size={20} color="t3" />
            </Pressable>
          </Row>
        ) : null}
        {docs.map((d) => (
          <DocRow key={d.id} doc={d} />
        ))}
        <View style={{ paddingTop: spacing[5], paddingHorizontal: spacing[5] }}>
          <Button
            label="파일 등록"
            icon="plus"
            disabled={!!upload}
            onPress={() => router.push('/docs/import')}
          />
        </View>
        <Text v="c1" color="t3" style={{ textAlign: 'center', paddingTop: spacing[3] }}>
          {SIZE_LIMIT.footnote}
        </Text>
      </ScrollView>
    </View>
  )
}

export default DocsTab

import { LegendList } from '@legendapp/list/react-native'
import { router, useIsFocused } from 'expo-router'
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { isJobSettled } from '@push/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { fileSize, monthDay } from '@push/shared'
import { Button, Icon, Spinner, Text } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { useDocuments, useIngestJob, useMyApplications, useSources, useUpload } from '../api/hooks'
import { INGEST_TEXT, PUSH_CARD_WIDTH } from '../constants'
import { pickResume, showImportMenu, useFileMenu, useImportRequest, useUndoRemove } from '../hooks'
import type { HubDocument, MySource, ScrollUnderBar } from '../types'
import { PUSH_DOCS_TITLE, pushCardLines, pushSeeAll, RETRY_LABEL, UPLOADS_TITLE } from '../utils'
import { TAB_EMPTY_LIFT } from './empty'
import FitRing from './fit-ring'
import ListTitle from './list-title'
import Row from './row'

const HIT = 44
const PUSH_CARD_RADIUS = 24
const RETRY_H = 32
const PROGRESS_H = 6
const EMPTY_INSET = 40

const openChat = () => router.push('/bots/push')

const DocRow = ({ doc, live }: { doc: MySource; live: boolean }) => {
  const qc = useQueryClient()
  const job = useIngestJob(doc.jobId, live).data
  const openMenu = useFileMenu(doc)
  const reading = !!doc.jobId && (!job || !isJobSettled(job))
  const failed = doc.status === 'FAILED' || job?.status === 'FAILED' || job?.status === 'DEAD'
  const retry = () => {
    void qc.invalidateQueries({ queryKey: ['ai-job', doc.jobId] })
    void qc.invalidateQueries({ queryKey: ['me', 'sources'] })
  }
  return (
    <Row label={displayName(doc.fileName)} onPress={() => router.push(`/docs/${doc.id}`)}>
      <View style={styles.body}>
        <Text v="b1" weight="700" numberOfLines={1}>
          {displayName(doc.fileName)}
        </Text>
        <View style={styles.meta}>
          <Text v="c1" color="t3">
            {fileSize(doc.size)}
            {doc.createdAt ? ` · ${monthDay(doc.createdAt)}` : ''}
            {reading || failed ? ' · ' : ''}
          </Text>
          {reading && !failed ? (
            <View style={styles.spinner}>
              <Spinner color="t1" />
            </View>
          ) : null}
          {reading || failed ? (
            <Text v="c1" weight="700" color={failed ? 'red' : 't1'}>
              {failed ? INGEST_TEXT.failed : INGEST_TEXT.reading}
            </Text>
          ) : null}
        </View>
      </View>
      {failed ? (
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          style={styles.retry}
        >
          <Text v="c1" weight="700">
            {RETRY_LABEL}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${displayName(doc.fileName)} 더 보기`}
        onPress={openMenu}
        style={styles.more}
      >
        {Platform.OS === 'ios' ? <Icon name="sort" size={22} color="t1" /> : <Icon name="more" size={20} color="t3" />}
      </Pressable>
    </Row>
  )
}

type PushApplication = { company: string; title: string; fitScore?: number | null }

const PushCard = ({ doc, application }: { doc: HubDocument; application: PushApplication | null }) => {
  const lines = pushCardLines(doc, application)
  const date = monthDay(doc.updatedAt)
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[lines.company, lines.title, lines.score && `적합도 10점 만점에 ${lines.score}점`, lines.doc, date].filter(Boolean).join(', ')}
      onPress={() => router.push(`/docs/push/${doc.id}`)}
      style={styles.card}
    >
      <View style={styles.cardHead}>
        <View style={styles.body}>
          <Text v="h2" weight="800" numberOfLines={1} style={styles.cardTitle}>
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
      <View style={styles.cardDoc}>
        <Text v="c1" weight="600" numberOfLines={1} style={styles.cardDocName}>
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

const DocsTab = ({ top = 0, onScroll, lead }: ScrollUnderBar) => {
  const focused = useIsFocused()
  const apps = useMyApplications()
  const { data, isLoading } = useSources()
  const push = useDocuments()
  const hidden = useUndoRemove()
  const { upload, start, cancel } = useUpload()
  const pickFile = () => void pickResume().then((file) => file && start(file))
  useImportRequest(pickFile)
  const renderDoc = ({ item }: { item: MySource }) => <DocRow doc={item} live={focused} />

  if (isLoading) return <ActivityIndicator style={styles.loading} />
  const docs = (data?.data ?? []).filter((d) => !hidden.includes(d.id))
  const pushDocs = push.data?.data ?? []
  const preview = pushDocs.slice(0, 3)
  if (docs.length === 0 && preview.length === 0 && !upload && !push.isLoading) {
    return (
      <View style={styles.empty}>
        <Text v="h2" style={styles.center}>
          아직 Push 프로필이 없어요
        </Text>
        <Text v="b2" color="t3" style={styles.center}>
          {'Bot 채팅에서 지원할 공고에 맞춘\nPush 프로필을 만들어 보세요.'}
        </Text>
        <View style={styles.emptyActions}>
          <Button label="Bot 채팅에서 만들기" onPress={openChat} />
          <Button label="가진 이력서 올리기" variant="secondary" onPress={pickFile} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <LegendList
        data={docs}
        keyExtractor={(d) => d.id}
        renderItem={renderDoc}
        estimatedItemSize={64}
        extraData={focused}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.list(top)}
        ListHeaderComponent={
          <>
        {lead}
        {preview.length > 0 ? (
          <>
            <View style={styles.pushHead}>
              <Text v="h2" accessibilityRole="header">
                {PUSH_DOCS_TITLE}
              </Text>
              <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/docs/push')}>
                <Text v="c1" weight="600" color="t2">
                  {pushSeeAll(pushDocs.length)}
                </Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pushScroll} contentContainerStyle={styles.pushCards}>
              {preview.map((d) => (
                <PushCard
                  key={d.id}
                  doc={d}
                  application={apps.data?.data.find((a) => a.id === d.applicationId) ?? null}
                />
              ))}
            </ScrollView>
          </>
        ) : null}
        <ListTitle title={UPLOADS_TITLE} count={docs.length + (upload ? 1 : 0)} top={32} />
        {upload ? (
          <Row>
            <View style={styles.upload}>
              <Text v="b1" weight="700" numberOfLines={1}>
                {displayName(upload.name)}
              </Text>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(upload.progress * 100) }}
                style={styles.progress}
              >
                <View style={styles.progressFill(upload.progress)} />
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
              style={styles.cancel}
            >
              <Icon name="x" size={18} color="t3" />
            </Pressable>
          </Row>
        ) : null}
          </>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              label="파일 등록"
              onPress={() => !upload && showImportMenu()}
            />
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  body: { flex: 1, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  spinner: { marginRight: theme.spacing[1] },
  retry: { height: RETRY_H, borderRadius: RETRY_H / 2, paddingHorizontal: theme.spacing[3], justifyContent: 'center', backgroundColor: theme.colors.fill },
  more: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: PUSH_CARD_WIDTH,
    borderRadius: PUSH_CARD_RADIUS,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.paper,
    padding: theme.spacing[2],
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[3],
    paddingTop: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    paddingBottom: theme.spacing[5],
  },
  cardTitle: { lineHeight: 27, letterSpacing: -0.6 },
  cardDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.bg2,
    padding: theme.spacing[3],
  },
  cardDocName: { flex: 1 },
  loading: { marginTop: 60 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: EMPTY_INSET,
    paddingBottom: TAB_EMPTY_LIFT,
  },
  center: { textAlign: 'center' },
  emptyActions: { alignSelf: 'stretch', gap: theme.spacing[2], marginTop: 18 },
  screen: { flex: 1 },
  list: (top: number) => ({ paddingTop: top, paddingBottom: theme.spacing[6] }),
  pushHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[1],
    paddingHorizontal: theme.spacing[5],
  },
  pushScroll: { marginTop: 10 },
  pushCards: { gap: theme.spacing[3], paddingHorizontal: theme.spacing[5], paddingTop: 1, paddingBottom: theme.spacing[2] },
  upload: { flex: 1, minWidth: 0, gap: theme.spacing[2] },
  progress: { height: PROGRESS_H, borderRadius: theme.radius.pill, backgroundColor: theme.colors.fill2, overflow: 'hidden' },
  progressFill: (progress: number) => ({
    width: `${progress * 100}%`,
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.ac,
  }),
  cancel: {
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    backgroundColor: Platform.OS === 'ios' ? theme.colors.fill : undefined,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingTop: theme.spacing[5], paddingHorizontal: theme.spacing[5] },
}))

export default DocsTab

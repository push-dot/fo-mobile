import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { isJobSettled } from '@push/api-client'
import { useQueryClient } from '@tanstack/react-query'
import { fileSize, monthDay } from '@push/shared'
import { BottomSheet, Button, Icon, Text, type IconName } from '@/shared/components'
import { pickDocument } from '@/shared/infrastructure'
import { useColors } from '../../../theme'
import { useDocuments, useIngestJob, useMyApplications, useSources, useUpload } from '../api/hooks'
import { INGEST_TEXT, MAX_BYTES, RESUME_DOCUMENT_OPTIONS } from '../constants'
import { useToast, useUndoRemove } from '../hooks'
import type { HubDocument, MySource } from '../types'
import { PUSH_DOCS_TITLE, pushCardLines, pushSeeAll, RETRY_LABEL, SIZE_LIMIT, UPLOADS_TITLE } from '../utils'
import DocMenu from './doc-menu'
import FitRing from './fit-ring'
import ListTitle from './list-title'
import Row from './row'
import Toast from './toast'

const openChat = () => router.push('/(tabs)/(chat)/chat')

const PickRow = ({
  icon,
  title,
  sub,
  tone,
  onPress,
}: {
  icon: IconName
  title: string
  sub: string
  tone: 'ac' | 'green'
  onPress: () => void
}) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: tone === 'ac' ? c.acSoft : c.greenSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={22} color={tone === 'ac' ? c.acText : c.green} />
      </View>
      <View style={{ flex: 1 }}>
        <Text v="b1" weight="700">
          {title}
        </Text>
        <Text v="c1" color="t3">
          {sub}
        </Text>
      </View>
      <Icon name="chev" size={18} color="t4" />
    </Pressable>
  )
}

const DocRow = ({ doc, onDelete }: { doc: MySource; onDelete: () => void }) => {
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text v="c1" color="t3">
            {fileSize(doc.size)}
            {doc.createdAt ? ` · ${monthDay(doc.createdAt)}` : ''}
            {reading || failed ? ' · ' : ''}
          </Text>
          {reading && !failed ? <ActivityIndicator size="small" style={{ transform: [{ scale: 0.6 }] }} /> : null}
          {reading || failed ? (
            <Text v="c1" weight="600" color={failed ? 'red' : 'acText'}>
              {failed ? INGEST_TEXT.failed : INGEST_TEXT.reading}
            </Text>
          ) : null}
        </View>
      </View>
      {failed ? <Button label={RETRY_LABEL} icon="retry" variant="secondary" size="sm" onPress={retry} /> : null}
      <DocMenu doc={doc} onDelete={onDelete}>
        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more" size={20} color="t3" />
        </View>
      </DocMenu>
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
      style={{ width: 236, borderRadius: 20, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg, padding: 8, gap: 8 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, paddingHorizontal: 12, minHeight: 52 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text v="h3" weight="800" numberOfLines={1}>
            {lines.title}
          </Text>
          {lines.company ? (
            <Text v="c1" color="t2" numberOfLines={1}>
              {lines.company}
            </Text>
          ) : null}
        </View>
        {lines.score ? <FitRing score={lines.score} /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, backgroundColor: c.bg2, paddingVertical: 10, paddingHorizontal: 12 }}>
        <Text v="c1" weight="700" numberOfLines={1} style={{ flex: 1 }}>
          {lines.doc}
        </Text>
        {date ? (
          <Text v="c1" color="t3">
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
  const toast = useToast()
  const undo = useUndoRemove()
  const [picking, setPicking] = useState(false)
  const { upload, start, cancel } = useUpload(() => toast.show('이력서 파일을 올렸어요'))

  const pickFile = async (fromSheet = false) => {
    setPicking(false)
    if (fromSheet) await new Promise((r) => setTimeout(r, 400))
    const res = await pickDocument(RESUME_DOCUMENT_OPTIONS)
    const file = res.canceled ? null : res.assets[0]
    if (!file) return
    if ((file.size ?? 0) > MAX_BYTES) return toast.fail(SIZE_LIMIT.title)
    void start(file)
  }

  if (isLoading) return <ActivityIndicator style={{ marginTop: 60 }} />
  const docs = (data?.data ?? []).filter((d) => d.id !== undo.hiddenId)
  const pushDocs = push.data?.data ?? []
  const preview = pushDocs.slice(0, 3)
  const notice = undo.toast.text ? undo.toast : toast
  const sheet = (
    <BottomSheet visible={picking} onClose={() => setPicking(false)} title="서류 가져오기">
      <View>
        <PickRow
          icon="folder"
          tone="ac"
          title="파일에서 고르기"
          sub="PDF, DOCX · 20MB까지"
          onPress={() => void pickFile(true)}
        />
        <PickRow
          icon="spark"
          tone="green"
          title="에이전트로 새로 만들기"
          sub="대화하면서 이력서를 써요"
          onPress={() => (setPicking(false), openChat())}
        />
      </View>
    </BottomSheet>
  )

  if (docs.length === 0 && preview.length === 0 && !upload && !push.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 40,
          paddingTop: 100,
        }}
      >
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 26,
            backgroundColor: c.acSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
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
        <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 18 }}>
          <Button label="파일 등록" onPress={() => void pickFile()} />
          <Button label="에이전트로 만들기" variant="secondary" onPress={openChat} />
        </View>
        {sheet}
        <Toast text={notice.text} action={notice.action} error={notice.error} onHide={notice.hide} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {preview.length > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 26, paddingHorizontal: 20 }}>
              <Text v="h2" accessibilityRole="header">
                {PUSH_DOCS_TITLE}
              </Text>
              <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/docs/push')}>
                <Text v="c1" weight="600" color="t2">
                  {pushSeeAll(pushDocs.length)}
                </Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
              {preview.map((d) => (
                <PushCard key={d.id} doc={d} />
              ))}
            </ScrollView>
          </>
        ) : null}
        <ListTitle title={UPLOADS_TITLE} count={docs.length + (upload ? 1 : 0)} top={26} />
        {upload ? (
          <Row>
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text v="b1" weight="700" numberOfLines={1}>
                {upload.name}
              </Text>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(upload.progress * 100) }}
                style={{ height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: 'hidden' }}
              >
                <View
                  style={{
                    width: `${upload.progress * 100}%`,
                    height: '100%',
                    borderRadius: 3,
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
              accessibilityLabel="올리기 취소"
              onPress={cancel}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="x" size={20} color="t3" />
            </Pressable>
          </Row>
        ) : null}
        {docs.map((d) => (
          <DocRow key={d.id} doc={d} onDelete={() => undo.ask(d)} />
        ))}
        <View style={{ paddingTop: 18, paddingHorizontal: 20 }}>
          <Button
            label="파일 등록"
            icon="plus"
            disabled={!!upload}
            onPress={() => setPicking(true)}
          />
        </View>
        <Text v="c1" color="t3" style={{ textAlign: 'center', paddingTop: 10 }}>
          {SIZE_LIMIT.footnote}
        </Text>
      </ScrollView>
      {sheet}
      <Toast text={notice.text} action={notice.action} error={notice.error} onHide={notice.hide} />
    </View>
  )
}

export default DocsTab

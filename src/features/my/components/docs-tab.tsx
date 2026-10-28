import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native'
import { isJobSettled } from '@push/api-client'
import { fileSize, monthDay } from '@push/shared'
import { BottomSheet, Button, Icon, Text, type IconName } from '@/shared/components'
import { pickDocument } from '@/shared/infrastructure'
import { useColors } from '../../../theme'
import { useIngestJob, useSources, useUpload } from '../api/hooks'
import { INGEST_TEXT, MAX_BYTES, RESUME_DOCUMENT_OPTIONS } from '../constants'
import { useToast } from '../hooks'
import type { MySource } from '../types'
import DocMenu from './doc-menu'
import FileTile from './file-tile'
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

const DocRow = ({ doc, onMenu }: { doc: MySource; onMenu: () => void }) => {
  const job = useIngestJob(doc.jobId).data
  const reading = !!doc.jobId && (!job || !isJobSettled(job))
  const failed = job?.status === 'FAILED' || job?.status === 'DEAD'
  return (
    <Row label={doc.fileName} onPress={() => router.push(`/docs/${doc.id}`)}>
      <FileTile name={doc.fileName} reading={reading} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="700" numberOfLines={1}>
          {doc.fileName}
        </Text>
        {reading || failed ? (
          <Text v="c1" color={failed ? 'red' : 't3'}>
            {failed ? INGEST_TEXT.failed : INGEST_TEXT.reading}
          </Text>
        ) : (
          <Text v="c1" color="t3">
            {fileSize(doc.size)}
            {doc.createdAt ? ` · ${monthDay(doc.createdAt)}` : ''}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="더 보기"
        onPress={onMenu}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="more" size={20} color="t3" />
      </Pressable>
    </Row>
  )
}

const DocsTab = () => {
  const c = useColors()
  const { data, isLoading } = useSources()
  const toast = useToast()
  const [picking, setPicking] = useState(false)
  const [menu, setMenu] = useState<MySource | null>(null)
  const { upload, start, cancel } = useUpload(() => toast.show('이력서 파일을 올렸어요'))

  const pickFile = async (fromSheet = false) => {
    setPicking(false)
    if (fromSheet) await new Promise((r) => setTimeout(r, 400))
    const res = await pickDocument(RESUME_DOCUMENT_OPTIONS)
    const file = res.canceled ? null : res.assets[0]
    if (!file) return
    if ((file.size ?? 0) > MAX_BYTES)
      return Alert.alert('20MB까지 올릴 수 있어요', '파일 크기를 줄여서 다시 올려 주세요.')
    void start(file)
  }

  if (isLoading) return <ActivityIndicator style={{ marginTop: 60 }} />
  const docs = data?.data ?? []
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
          title="AI로 새로 만들기"
          sub="대화하면서 이력서를 써요"
          onPress={() => (setPicking(false), openChat())}
        />
      </View>
    </BottomSheet>
  )

  if (docs.length === 0 && !upload) {
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
          {'PDF나 DOCX 파일을 올리거나\nAI로 새로 만들어 보세요.'}
        </Text>
        <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 18 }}>
          <Button label="파일 등록" onPress={() => void pickFile()} />
          <Button label="AI로 만들기" variant="secondary" onPress={openChat} />
        </View>
        {sheet}
        <Toast text={toast.text} onHide={toast.hide} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <ListTitle title="내 서류" count={docs.length + (upload ? 1 : 0)} top={26} />
        {upload ? (
          <Row>
            <FileTile name={upload.name} />
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
          <DocRow key={d.id} doc={d} onMenu={() => setMenu(d)} />
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
          PDF, DOCX 파일을 20MB까지 올릴 수 있어요.
        </Text>
      </ScrollView>
      {sheet}
      <DocMenu doc={menu} onClose={() => setMenu(null)} />
      <Toast text={toast.text} onHide={toast.hide} />
    </View>
  )
}

export default DocsTab

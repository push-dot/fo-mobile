import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native'
import type { Source } from '@push/api-client'
import { useColors } from '../../theme'
import { BottomSheet, Button, Icon, Text, type IconName } from '../../ui'
import { myApi } from './api'
import { fileKind, fileSize, monthDay } from './lib'
import { ListTitle, Row, useToast, Toast } from './parts'

const MAX_BYTES = 20 * 1024 * 1024
const DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const openChat = () => router.push('/(tabs)/(chat)/chat')

export const useSources = () =>
  useQuery({ queryKey: ['me', 'sources'], queryFn: () => myApi.sources() })

/** PDF/DOCX tile: red for PDF, violet for DOCX. */
export function FileTile({ name, small }: { name: string; small?: boolean }) {
  const c = useColors()
  const pdf = fileKind(name) === 'PDF'
  return (
    <View
      style={{
        width: small ? 30 : 40,
        height: small ? 36 : 48,
        borderRadius: 8,
        backgroundColor: pdf ? c.redSoft : c.acSoft,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: small ? 4 : 6,
      }}
    >
      <Text
        weight="800"
        style={{ fontSize: small ? 8 : 10, lineHeight: small ? 10 : 12, color: pdf ? c.red : c.ac }}
      >
        {fileKind(name)}
      </Text>
    </View>
  )
}

type Upload = { name: string; size: number; progress: number }

/** Upload with a progress estimate: fetch has no upload progress, so it eases toward 90% until the response. */
const useUpload = (onDone: () => void) => {
  const qc = useQueryClient()
  const [upload, setUpload] = useState<Upload | null>(null)
  const cancelled = useRef(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => () => clearInterval(timer.current ?? undefined), [])

  const start = async (file: DocumentPicker.DocumentPickerAsset) => {
    const size = file.size ?? 0
    cancelled.current = false
    setUpload({ name: file.name, size, progress: 0.05 })
    timer.current = setInterval(
      () => setUpload((u) => u && { ...u, progress: u.progress + (0.9 - u.progress) * 0.12 }),
      200,
    )
    try {
      const s = await myApi.upload(file)
      if (cancelled.current) await myApi.remove(s.id).catch(() => undefined)
      else onDone()
    } catch {
      if (!cancelled.current)
        Alert.alert('파일을 올리지 못했어요', '네트워크를 확인하고 다시 올려 주세요.')
    } finally {
      clearInterval(timer.current ?? undefined)
      setUpload(null)
      void qc.invalidateQueries({ queryKey: ['me', 'sources'] })
    }
  }
  const cancel = () => {
    cancelled.current = true
    clearInterval(timer.current ?? undefined)
    setUpload(null)
  }
  return { upload, start, cancel }
}

function PickRow({
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
}) {
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

/** 서류 더 보기 sheet: 보기 · 삭제. */
export function DocMenu({
  doc,
  onClose,
  onDeleted,
  viewing,
}: {
  doc: Source | null
  onClose: () => void
  onDeleted?: () => void
  viewing?: boolean
}) {
  const qc = useQueryClient()
  const remove = useMutation({
    mutationFn: (id: string) => myApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['me', 'sources'] })
      onClose()
      onDeleted?.()
    },
  })
  return (
    <BottomSheet visible={!!doc} onClose={onClose} title={doc?.fileName}>
      {viewing ? null : (
        <Button
          label="서류 보기"
          variant="secondary"
          onPress={() => {
            onClose()
            router.push(`/docs/${doc!.id}`)
          }}
        />
      )}
      <Button
        label={remove.isPending ? '삭제하는 중' : '서류 삭제하기'}
        variant="secondary"
        disabled={remove.isPending}
        onPress={() =>
          Alert.alert('이 서류를 삭제할까요?', '삭제하면 되돌릴 수 없어요.', [
            { text: '취소', style: 'cancel' },
            { text: '삭제하기', style: 'destructive', onPress: () => remove.mutate(doc!.id) },
          ])
        }
      />
    </BottomSheet>
  )
}

/** 마이 › 서류: 내 서류 list, 서류 가져오기 sheet, upload progress and toast. */
export function DocsTab() {
  const c = useColors()
  const { data, isLoading } = useSources()
  const toast = useToast()
  const [picking, setPicking] = useState(false)
  const [menu, setMenu] = useState<Source | null>(null)
  const { upload, start, cancel } = useUpload(() => toast.show('이력서 파일을 올렸어요'))

  const pickFile = async (fromSheet = false) => {
    setPicking(false)
    // iOS can't present the picker while the sheet's modal is still dismissing.
    if (fromSheet) await new Promise((r) => setTimeout(r, 400))
    const res = await DocumentPicker.getDocumentAsync({
      type: DOC_TYPES,
      copyToCacheDirectory: true,
    })
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
          <Row key={d.id} label={d.fileName} onPress={() => router.push(`/docs/${d.id}`)}>
            <FileTile name={d.fileName} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text v="b1" weight="700" numberOfLines={1}>
                {d.fileName}
              </Text>
              <Text v="c1" color="t3">
                {fileSize(d.size)}
                {d.createdAt ? ` · ${monthDay(d.createdAt)}` : ''}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="더 보기"
              onPress={() => setMenu(d)}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="more" size={20} color="t3" />
            </Pressable>
          </Row>
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

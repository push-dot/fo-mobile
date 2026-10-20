import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../../lib/api'
import { useColors } from '../../theme'
import { BottomSheet, Glass, Icon, Text } from '../../ui'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Doc = { id: string; name: string; note: string; kind: 'tailored' | 'original' | 'portfolio' }

// shortcut: @push/api-client has no "my documents" endpoint yet; board samples until push-be exposes one.
const docsFor = (company: string): Doc[] => [
  { id: 'doc-tailored', name: `${company}_백엔드_이력서_v2.pdf`, note: 'AI로 맞춘 서류 · 오늘', kind: 'tailored' },
  { id: 'doc-original', name: '김서준_백엔드_이력서_2026.pdf', note: '원본 · 10월 12일', kind: 'original' },
  { id: 'doc-portfolio', name: '포트폴리오_결제시스템.pdf', note: '함께 보낼 수 있어요 · 8월 3일', kind: 'portfolio' },
]

type Props = {
  postingId: string
  company: string
  visible: boolean
  onClose: () => void
  onApplied: () => void
  /** Posting title for the "회사 · 제목" line under the question. */
  title?: string
}

/** 지원하기 sheet: pick 이력서 (AI로 맞춘 서류 or 원본) and optionally the 포트폴리오, then apply. */
export function ApplySheet({ postingId, company, visible, onClose, onApplied, title }: Props) {
  const qc = useQueryClient()
  const docs = docsFor(company)
  const [resume, setResume] = useState(docs[0]!.id)
  const [portfolio, setPortfolio] = useState(false)
  const apply = useMutation({
    // push-be 400s on non-UUID document ids, so the board samples are dropped and the application goes in without files.
    mutationFn: () => api.postings.apply(postingId, (portfolio ? [resume, 'doc-portfolio'] : [resume]).filter((d) => UUID.test(d))),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['postings'] })
      onApplied()
    },
  })
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="어떤 서류로 지원할까요?"
      description={title ? `${company} · ${title}` : company}
      action={{ label: apply.isPending ? '지원하는 중…' : '이 서류로 지원하기', onPress: () => apply.mutate(), disabled: apply.isPending }}
    >
      <View>
        {docs.map((d) => {
          const on = d.kind === 'portfolio' ? portfolio : resume === d.id
          return (
            <DocRow
              key={d.id}
              doc={d}
              on={on}
              onPress={() => (d.kind === 'portfolio' ? setPortfolio(!portfolio) : setResume(d.id))}
            />
          )
        })}
      </View>
      <Text v="c1" color={apply.isError ? 'red' : 't3'}>
        {apply.isError ? '지원하지 못했어요. 잠시 후 다시 눌러 주세요.' : '지원하면 마이 › 내 활동 › 지원활동에 기록돼요.'}
      </Text>
    </BottomSheet>
  )
}

function DocRow({ doc, on, onPress }: { doc: Doc; on: boolean; onPress: () => void }) {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole={doc.kind === 'portfolio' ? 'checkbox' : 'radio'}
      accessibilityState={doc.kind === 'portfolio' ? { checked: on } : { selected: on }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: on ? 7 : 2, borderColor: on ? c.ac : c.t4 }} />
      <View style={{ width: 30, height: 36, borderRadius: 8, backgroundColor: c.redSoft, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 }}>
        <Text v="c2" weight="800" color="red" style={{ fontSize: 8, lineHeight: 10 }}>
          PDF
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="600" numberOfLines={1}>
          {doc.name}
        </Text>
        <Text v="c1" color="t3">
          {doc.note}
        </Text>
      </View>
    </Pressable>
  )
}

/** Bottom toast (Applied board): glass on iOS, inverted t1 on Android. Hides itself after 3s. */
export function Toast({ message, onHide, bottom }: { message: string | null; onHide: () => void; bottom?: number }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const hide = useRef(onHide)
  useEffect(() => {
    hide.current = onHide
  })
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => hide.current(), 3000)
    return () => clearTimeout(t)
  }, [message])
  if (!message) return null
  const ios = Platform.OS === 'ios'
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={14} color="#FFFFFF" />
      </View>
      <Text v="b2" weight="600" style={{ flex: 1, color: ios ? c.t1 : c.bg }}>
        {message}
      </Text>
    </View>
  )
  const style = { borderRadius: 18, overflow: 'hidden' as const }
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
      style={{ position: 'absolute', left: 20, right: 20, bottom: bottom ?? insets.bottom + 92, zIndex: 8 }}
    >
      {ios ? <Glass style={style}>{content}</Glass> : <View style={[style, { backgroundColor: c.t1 }]}>{content}</View>}
    </View>
  )
}

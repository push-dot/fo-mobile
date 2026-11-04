import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fileSize, monthDay } from '@push/shared'
import {
  DocMenu,
  PREVIEW_HEADINGS,
  Toast,
  useConvertDocument,
  useResumeDraft,
  useSource,
  useUndoRemove,
  type ResumeDraft,
} from '@/features/my'
import { Badge, BottomSheet, Button, GlassButton, Text, TopBar } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { useColors } from '@/theme'

const ToProfileSheet = ({ id, visible, onClose }: { id: string; visible: boolean; onClose: () => void }) => {
  const convert = useConvertDocument((documentId) => {
    onClose()
    router.push(`/docs/push/${documentId}`)
  })
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="이 이력서로 프로필을 채울까요?"
      description="지원 서류용 프로필로 만들어요."
      action={{
        label: convert.isPending ? '만드는 중' : '지원 서류용 프로필로 만들기',
        onPress: () => convert.mutate(id),
        disabled: convert.isPending,
      }}
    >
      <View />
    </BottomSheet>
  )
}

const Paper = ({ d }: { d: ResumeDraft }) => {
  const c = useColors()
  const p = d.profile
  const head = (t: string) => (
    <Text
      weight="800"
      style={{
        fontSize: 11,
        lineHeight: 14,
        color: c.acText,
        borderBottomWidth: 1,
        borderBottomColor: c.line,
        paddingBottom: 3,
        marginTop: 6,
      }}
    >
      {t}
    </Text>
  )
  return (
    <View
      accessibilityLabel={`${p.displayName} 서류 미리보기`}
      style={{
        width: '100%',
        aspectRatio: 1 / 1.414,
        backgroundColor: c.paper,
        borderRadius: 6,
        padding: 20,
        gap: 7,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <Text weight="800" style={{ fontSize: 19, lineHeight: 24 }}>
        {p.displayName}
      </Text>
      <Text color="t3" style={{ fontSize: 10, lineHeight: 13 }}>
        {[d.email, ...d.links].filter(Boolean).join(' · ')}
      </Text>
      <Text color="t2" style={{ fontSize: 10.5, lineHeight: 15 }}>
        {p.intro}
      </Text>
      {head(PREVIEW_HEADINGS[0])}
      {p.careers.map((cr) => (
        <View key={`${cr.company}-${cr.startedOn}`} style={{ gap: 2 }}>
          <Text weight="700" style={{ fontSize: 11, lineHeight: 15 }}>
            {cr.company} · {cr.role}{' '}
            <Text color="t3" style={{ fontSize: 11 }}>
              {cr.startedOn.replace('-', '.')} – {cr.endedOn?.replace('-', '.') ?? '현재'}
            </Text>
          </Text>
          {cr.description ? (
            <Text color="t2" style={{ fontSize: 10, lineHeight: 14 }}>
              {cr.description}
            </Text>
          ) : null}
        </View>
      ))}
      {head(PREVIEW_HEADINGS[1])}
      {(d.projects ?? []).map((project) => (
        <Text key={project} color="t2" style={{ fontSize: 10, lineHeight: 14 }}>
          {project}
        </Text>
      ))}
      {head(PREVIEW_HEADINGS[2])}
      <Text color="t2" style={{ fontSize: 10, lineHeight: 14 }}>
        {p.skills.join(' · ')}
      </Text>
    </View>
  )
}

const DocViewerScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [sheet, setSheet] = useState(false)
  const [menu, setMenu] = useState(false)
  const doc = useSource(id)
  const draft = useResumeDraft(id)
  const undo = useUndoRemove(() => router.back())
  const s = doc.data
  const d = draft.data

  return (
    <View style={{ flex: 1, backgroundColor: c.bg2 }}>
      <TopBar
        title={s?.fileName ?? '서류 보기'}
        onBack={() => router.back()}
        right={
          <GlassButton
            actions={[
              // shortcut: Source has no download URL yet, so 공유 shares the file name; share the file once push-be returns a URL.
              {
                icon: 'share',
                label: '공유',
                onPress: () => s && void shareMessage({ message: s.fileName }),
              },
              { icon: 'more', label: '더 보기', onPress: () => setMenu(true) },
            ]}
          />
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {s ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 20,
            }}
          >
            <Text v="c1" color="t3" style={{ flex: 1 }}>
              {fileSize(s.size)}
              {d?.pageCount ? ` · ${d.pageCount}쪽` : ''}
              {s.createdAt ? ` · ${monthDay(s.createdAt)} 등록` : ''}
            </Text>
            {d?.pageCount ? <Badge label={`1 / ${d.pageCount}`} tone="grey" /> : null}
          </View>
        ) : null}
        <View style={{ paddingTop: 4, paddingHorizontal: 36 }}>
          {d ? (
            <Paper d={d} />
          ) : draft.isPending ? (
            <ActivityIndicator style={{ marginTop: 60 }} />
          ) : (
            <Text v="b2" color="t3" style={{ marginTop: 60, textAlign: 'center' }}>
              미리보기는 곧 볼 수 있어요
            </Text>
          )}
        </View>
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingTop: 14,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 10,
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.line,
        }}
      >
        <Button
          label="AI로 고치기"
          icon="spark"
          variant="secondary"
          onPress={() => router.push('/(tabs)/(chat)/chat')}
        />
        <Button
          label="지원 서류용 프로필로 만들기"
          icon="user"
          disabled={!d}
          onPress={() => setSheet(true)}
          style={{ flex: 1 }}
        />
      </View>
      <ToProfileSheet id={id} visible={sheet} onClose={() => setSheet(false)} />
      <DocMenu doc={menu ? (s ?? null) : null} viewing onClose={() => setMenu(false)} onDelete={() => s && undo.ask(s)} />
      <Toast text={undo.toast.text} action={undo.toast.action} onHide={undo.toast.hide} />
    </View>
  )
}

export default DocViewerScreen

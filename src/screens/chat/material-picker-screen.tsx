import { useState, type ReactNode } from 'react'
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native'
import { CHAT_ATTACHMENT_OPTIONS, CHAT_ATTACHMENT_OPTIONS_ANDROID, PageModal, isChatAttachment, appendDraftText, attachDraftFile, docMeta, postingMeta, useChatDocs } from '@/features/chat'
import { MAX_BYTES, SIZE_LIMIT, useBookmarkList } from '@/features/my'
import { pickDocument } from '@/shared/infrastructure'
import { displayName } from '@/shared/utility/display-name'
import { Button, Text, TextField } from '@/shared/components'
import { spacing, type, useColors } from '@/theme'

type Row = { id: string; title: string; meta: string }

const LIST = { paddingTop: spacing[1], paddingHorizontal: spacing[5], gap: 6 }
const ROW_MIN = 50
const ROW_TEXT = { fontSize: type.h3.fontSize, lineHeight: type.b2.lineHeight }
const SECTION_LABEL = { paddingTop: 10, paddingBottom: 2 }

const RowLine = () => {
  const c = useColors()
  return <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: StyleSheet.hairlineWidth, backgroundColor: c.line }} />
}

const PickerRow = ({ last, onPress, role, checked, children }: { last?: boolean; onPress: () => void; role: 'checkbox' | 'button'; checked?: boolean; children: ReactNode }) => (
  <Pressable accessibilityRole={role} accessibilityState={role === 'checkbox' ? { checked } : undefined} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: ROW_MIN }}>
    {children}
    {last ? null : <RowLine />}
  </Pressable>
)

/** ChatPh0Picker: 자료 고르기 is a page-style modal (a close button, one 추가 button), also opened inside the approval form's own modal. */
const MaterialPickerScreen = ({ target, onClose }: { target: string; onClose: () => void }) => {
  const [pasting, setPasting] = useState(false)
  const [text, setText] = useState('')
  const [picks, setPicks] = useState<string[]>([])
  const docs = useChatDocs()
  const bookmarks = useBookmarkList(true)
  const sections: { title: string; rows: Row[] }[] = [
    { title: '마이 › 서류', rows: (docs.data ?? []).map((d) => ({ id: d.id, title: displayName(d.fileName), meta: docMeta(d) })) },
    { title: '홈 › 북마크 공고', rows: (bookmarks.data?.data ?? []).map((p) => ({ id: p.id, title: `${p.company} · ${p.title}`, meta: postingMeta(p) })) },
  ]
  const toggle = (id: string) => setPicks((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const done = (value: string) => {
    appendDraftText(target, value)
    onClose()
  }
  const add = () => done(sections.flatMap((s) => s.rows).filter((r) => picks.includes(r.id)).map((r) => r.title).join(', '))
  const submit = () => text.trim() && done(text.trim())
  const pickFile = async () => {
    const picked = await pickDocument(Platform.OS === 'android' ? CHAT_ATTACHMENT_OPTIONS_ANDROID : CHAT_ATTACHMENT_OPTIONS)
    const asset = picked.canceled ? undefined : picked.assets[0]
    if (!asset) return
    if (!isChatAttachment(asset.name)) {
      Alert.alert('올릴 수 없는 파일이에요', 'PDF, Word, 텍스트 파일만 올릴 수 있어요.')
      return
    }
    if ((asset.size ?? 0) > MAX_BYTES) {
      Alert.alert(SIZE_LIMIT.title, SIZE_LIMIT.body)
      return
    }
    attachDraftFile(target, { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size })
    onClose()
  }
  // MaterialsLinkAdd sorts a pasted link by itself, so one row covers GitHub and posting links.
  const others: [string, () => void][] = [
    ['파일에서 고르기', () => void pickFile()],
    ['링크 붙여넣기', () => setPasting(true)],
  ]
  return (
    <PageModal
      title="자료 고르기"
      onClose={onClose}
      footer={<Button label={pasting ? '넣기' : `${picks.length}개 추가`} disabled={pasting ? !text.trim() : !picks.length} onPress={pasting ? submit : add} />}
    >
      {pasting ? (
        <View style={{ paddingHorizontal: spacing[4] }}>
          <TextField
            value={text}
            onChangeText={setText}
            placeholder="https://"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoFocus
            onSubmitEditing={submit}
            accessibilityLabel="링크"
          />
        </View>
      ) : (
        <View style={LIST}>
          {sections.map((sec) =>
            sec.rows.length ? (
              <View key={sec.title} style={{ gap: LIST.gap }}>
                <Text v="c1" color="t3" style={SECTION_LABEL}>
                  {sec.title}
                </Text>
                {sec.rows.map((r) => (
                  <PickerRow key={r.id} role="checkbox" checked={picks.includes(r.id)} onPress={() => toggle(r.id)}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text v="b1" numberOfLines={1} style={ROW_TEXT}>
                        {r.title}
                      </Text>
                      <Text v="c1" color="t3" numberOfLines={1}>
                        {r.meta}
                      </Text>
                    </View>
                    {picks.includes(r.id) ? (
                      <Text v="b1" weight="700" color="ac" style={ROW_TEXT}>
                        ✓
                      </Text>
                    ) : null}
                  </PickerRow>
                ))}
              </View>
            ) : null,
          )}
          <Text v="c1" color="t3" style={SECTION_LABEL}>
            다른 곳에서
          </Text>
          {others.map(([label, onPress], n) => (
            <PickerRow key={label} role="button" last={n === others.length - 1} onPress={onPress}>
              <Text v="b1" style={[{ flex: 1 }, ROW_TEXT]}>
                {label}
              </Text>
              <Text v="b2" color="t3">
                ›
              </Text>
            </PickerRow>
          ))}
        </View>
      )}
    </PageModal>
  )
}

export default MaterialPickerScreen

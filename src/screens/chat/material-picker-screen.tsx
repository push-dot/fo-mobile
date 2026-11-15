import { useState } from 'react'
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native'
import { CHAT_ATTACHMENT_OPTIONS, CHAT_ATTACHMENT_OPTIONS_ANDROID, PageModal, isChatAttachment, appendDraftText, attachDraftFile, docMeta, postingMeta, useChatDocs } from '@/features/chat'
import { MAX_BYTES, SIZE_LIMIT, useBookmarkList } from '@/features/my'
import { pickDocument } from '@/shared/infrastructure'
import { displayName } from '@/shared/utility/display-name'
import { Button, Icon, Text, TextField } from '@/shared/components'
import { onAccent, selectedRing, spacing, type, useColors } from '@/theme'

type Row = { id: string; title: string; meta: string }

// `.pnl-sub { padding: 10px 4px 2px }`
const SECTION_LABEL = { paddingTop: 10, paddingBottom: 2, paddingHorizontal: spacing[1] }

/** ChatPh0Picker: 자료 고르기 is a page-style modal (a close button, one 추가 button), also opened inside the approval form's own modal. */
const MaterialPickerScreen = ({ target, onClose }: { target: string; onClose: () => void }) => {
  const c = useColors()
  const ring = selectedRing(c)
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
        <View style={{ gap: spacing[2], paddingHorizontal: spacing[4] }}>
          {sections.map((s) =>
            s.rows.length ? (
              <View key={s.title} style={{ gap: spacing[2] }}>
                <Text v="c1" weight="700" color="t3" style={SECTION_LABEL}>
                  {s.title}
                </Text>
                {s.rows.map((r) => {
                  const on = picks.includes(r.id)
                  return (
                    <Pressable
                      key={r.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      onPress={() => toggle(r.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: spacing[3],
                        minHeight: 64,
                        paddingVertical: spacing[3] - ring.borderWidth,
                        paddingHorizontal: 14 - ring.borderWidth,
                        borderRadius: 14,
                        ...(on ? ring : { borderWidth: ring.borderWidth, borderColor: 'transparent' }),
                      }}
                    >
                      <View style={{ width: 24, height: 24, marginTop: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ac : c.fill }}>
                        {on ? <Icon name="check" size={14} color={onAccent} /> : null}
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text v="b1" weight="600" color={on ? 'acText' : 't1'} numberOfLines={1} style={{ lineHeight: type.b2.lineHeight }}>
                          {r.title}
                        </Text>
                        <Text v="c1" weight="500" color={on ? 'acText' : 't3'} numberOfLines={1}>
                          {r.meta}
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            ) : null,
          )}
          <Text v="c1" weight="700" color="t3" style={SECTION_LABEL}>
            다른 곳에서
          </Text>
          {others.map(([label, onPress]) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              onPress={onPress}
              style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: spacing[1], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line }}
            >
              <Text v="b1" style={{ flex: 1 }}>
                {label}
              </Text>
              <Icon name="chev" size={18} color="t3" />
            </Pressable>
          ))}
        </View>
      )}
    </PageModal>
  )
}

export default MaterialPickerScreen

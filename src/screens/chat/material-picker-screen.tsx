import { useState } from 'react'
import { View } from 'react-native'
import { PageModal, appendDraftText, attachPickedFile, docMeta, postingMeta, useChatDocs } from '@/features/chat'
import { GroupTitle, MaterialNavRow, MaterialPickRow, SECTION_LABEL } from '@/features/materials'
import { useBookmarkList } from '@/features/my'
import { displayName } from '@/shared/utility/display-name'
import { Button, TextField } from '@/shared/components'
import { spacing } from '@/theme'

type Row = { id: string; title: string; meta: string }

const ADD_BUTTON = { minHeight: 52, borderRadius: 26 }
const OTHER_TITLE = '다른 곳에서'

/** 자료 고르기 is a page-style modal (a close button, one 추가 button), also opened inside the approval form's own modal. */
const MaterialPickerScreen = ({ target, onClose }: { target: string; onClose: () => void }) => {
  const [pasting, setPasting] = useState(false)
  const [text, setText] = useState('')
  const [picks, setPicks] = useState<string[]>([])
  const docs = useChatDocs()
  const bookmarks = useBookmarkList(true)
  const sections: { title: string; rows: Row[] }[] = [
    { title: SECTION_LABEL.doc, rows: (docs.data ?? []).map((d) => ({ id: d.id, title: displayName(d.fileName), meta: docMeta(d) })) },
    { title: SECTION_LABEL.bookmark, rows: (bookmarks.data?.data ?? []).map((p) => ({ id: p.id, title: `${p.company} · ${p.title}`, meta: postingMeta(p) })) },
  ]
  const toggle = (id: string) => setPicks((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const done = (value: string) => {
    appendDraftText(target, value)
    onClose()
  }
  const add = () => done(sections.flatMap((s) => s.rows).filter((r) => picks.includes(r.id)).map((r) => r.title).join(', '))
  const submit = () => text.trim() && done(text.trim())
  const pickFile = async () => {
    if (await attachPickedFile(target)) onClose()
  }
  // MaterialsLinkAdd sorts a pasted link by itself, so one row covers GitHub and posting links.
  const others: [string, () => void][] = [
    ['파일에서 고르기', () => void pickFile()],
    ['링크 붙여넣기', () => setPasting(true)],
  ]
  return (
    <PageModal
      title="자료 고르기"
      sheet
      onClose={onClose}
      footer={<Button label={pasting ? '넣기' : `${picks.length}개 추가`} disabled={pasting ? !text.trim() : !picks.length} onPress={pasting ? submit : add} style={ADD_BUTTON} />}
    >
      {pasting ? (
        <View style={{ paddingHorizontal: spacing[5] }}>
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
        <View>
          {sections.map((sec) =>
            sec.rows.length ? (
              <View key={sec.title}>
                <GroupTitle label={sec.title} count={sec.rows.length} />
                {sec.rows.map((r) => (
                  <MaterialPickRow key={r.id} title={r.title} sub={r.meta} picked={picks.includes(r.id)} onToggle={() => toggle(r.id)} />
                ))}
              </View>
            ) : null,
          )}
          <GroupTitle label={OTHER_TITLE} />
          {others.map(([label, onPress]) => (
            <MaterialNavRow key={label} label={label} onPress={onPress} />
          ))}
        </View>
      )}
    </PageModal>
  )
}

export default MaterialPickerScreen

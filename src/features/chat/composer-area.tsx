import { useRef, useState, type ReactNode } from 'react'
import { Platform, Pressable, ScrollView, View, type TextInputInstance } from 'react-native'
import { useColors, useShadow } from '../../theme'
import { Glass, Icon, Text } from '@/shared/components'
import { pickChatAttachment } from './api/files'
import { useAccessMode, useMentionGroups } from './api/hooks'
import { Composer } from './composer'
import { FileTag } from './items'
import { filterMentions, insertMention, mentionQuery, type MentionItem } from './mentions'
import { Appear } from './motion'
import { Mark } from './components'
import { QUICK_STARTS, type QuickStart } from './quick-starts'

type Props = {
  placeholder: string
  onSend: (text: string, attachment?: string) => void
  working?: boolean
  onStop?: () => void
  /** Picked a 바로가기 from the @ list. */
  onShortcut: (qs: QuickStart) => void
  /** Reports typing so the first screen can hide its quick-start pills. */
  onTyping?: (typing: boolean) => void
  /** Floats above the box (StatusRow). */
  above?: ReactNode
  inputRef?: React.RefObject<TextInputInstance | null>
}

/** Composer + @ 언급 popover + attachment. Same on the first screen and in conversations. */
export const ComposerArea = ({ placeholder, onSend, working, onStop, onShortcut, onTyping, above, inputRef }: Props) => {
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<string>()
  const own = useRef<TextInputInstance>(null)
  const ref = inputRef ?? own
  const query = mentionQuery(text)
  const access = useAccessMode()

  const change = (t: string) => {
    setText(t)
    onTyping?.(t.length > 0)
  }
  const submit = () => {
    if (!text.trim()) return
    onSend(text.trim(), attachment)
    change('')
    setAttachment(undefined)
  }
  const attach = async () => {
    const r = await pickChatAttachment()
    if (!r.canceled && r.assets[0]) setAttachment(r.assets[0].name)
  }
  const pick = (m: MentionItem) => {
    if (m.kind === 'shortcut') {
      change(text.replace(/@([^\s@]*)$/, ''))
      const qs = QUICK_STARTS.find((q) => q.key === m.id)
      if (qs) onShortcut(qs)
      return
    }
    change(insertMention(text, m.title))
  }

  return (
    <View style={{ gap: 8 }}>
      {query !== null ? <MentionPopover query={query} onPick={pick} /> : above}
      <Composer
        inputRef={ref}
        value={text}
        onChangeText={change}
        onSend={submit}
        placeholder={placeholder}
        working={working}
        onStop={onStop}
        onAttach={() => void attach()}
        // Inserting "@" opens the suggestions right away.
        onMention={() => (change(text && !/\s$/.test(text) ? `${text} @` : `${text}@`), ref.current?.focus())}
        // shortcut: no speech dependency; the keyboard's dictation key handles voice for now.
        onMic={() => ref.current?.focus()}
        attachment={attachment}
        onClearAttachment={() => setAttachment(undefined)}
        accessMode={access.mode}
        onAccessMode={access.pick}
      />
    </View>
  )
}

const MentionPopover = ({ query, onPick }: { query: string; onPick: (m: MentionItem) => void }) => {
  const c = useColors()
  const shadow = useShadow()
  const groups = filterMentions(useMentionGroups(), query)
  let first = true
  const body = (
    <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ padding: 8 }} keyboardShouldPersistTaps="always">
      {groups.length === 0 ? (
        <Text v="b2" color="t3" style={{ padding: 10 }}>
          “{query}”에 맞는 항목이 없어요
        </Text>
      ) : (
        groups.map((g) => (
          <View key={g.title}>
            <Text v="c2" weight="700" color="t3" style={{ paddingTop: 8, paddingHorizontal: 10, paddingBottom: 4 }}>
              {g.title}
            </Text>
            {g.items.map((m) => {
              const hl = first
              first = false
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${g.title}, ${m.title}`}
                  onPress={() => onPick(m)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, backgroundColor: hl || pressed ? c.fill : 'transparent' })}
                >
                  {m.kind === 'job' ? <Mark text={m.tag ?? ''} color="#1F3A8A" size={36} /> : null}
                  {m.kind === 'doc' ? <FileTag tag={m.tag ?? 'PDF'} w={30} h={36} /> : null}
                  {m.kind === 'link' ? (
                    <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: c.fill2, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="link" size={18} color="t2" />
                    </View>
                  ) : null}
                  {m.kind === 'shortcut' ? (
                    <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: c.acSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="spark" size={18} color="acText" />
                    </View>
                  ) : null}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text v="b2" weight="600" numberOfLines={1}>
                      {m.hit ? (
                        <>
                          {m.title.slice(0, m.hit.start)}
                          <Text v="b2" weight="700" color="acText">
                            {m.title.slice(m.hit.start, m.hit.end)}
                          </Text>
                          {m.title.slice(m.hit.end)}
                        </>
                      ) : (
                        m.title
                      )}
                    </Text>
                    {m.sub ? (
                      <Text v="c2" color="t3" numberOfLines={1}>
                        {m.sub}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )
            })}
          </View>
        ))
      )}
    </ScrollView>
  )
  return (
    <Appear duration={250}>
      {Platform.OS === 'ios' ? (
        <Glass surface="sheet" style={{ borderRadius: 26, overflow: 'hidden' }}>
          {body}
        </Glass>
      ) : (
        <View style={[shadow.pop, { borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, elevation: 8 }]}>{body}</View>
      )}
    </Appear>
  )
}

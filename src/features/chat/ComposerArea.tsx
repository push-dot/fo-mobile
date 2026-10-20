import { useQuery } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Platform, Pressable, ScrollView, View, type TextInputInstance } from 'react-native'
import { api } from '../../lib/api'
import { useColors, useShadow } from '../../theme'
import { Glass, Icon, Text } from '../../ui'
import { chatApi } from './api'
import { Composer } from './Composer'
import { FileTag } from './Items'
import { filterMentions, insertMention, mentionQuery, type MentionGroup, type MentionItem } from './mentions'
import { Appear } from './motion'
import { Mark } from './parts'
import { QUICK_STARTS, type QuickStart } from './quickStarts'

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
export function ComposerArea({ placeholder, onSend, working, onStop, onShortcut, onTyping, above, inputRef }: Props) {
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<string>()
  const own = useRef<TextInputInstance>(null)
  const ref = inputRef ?? own
  const query = mentionQuery(text)

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
    const r = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'],
      copyToCacheDirectory: false,
    })
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
      />
    </View>
  )
}

function useMentionGroups(): MentionGroup[] {
  const bookmarks = useQuery({ queryKey: ['me', 'bookmarks', 'mention'], queryFn: () => api.me.bookmarks({ limit: 20 }) })
  const docs = useQuery({ queryKey: ['chat', 'docs'], queryFn: chatApi.docs })
  const links = useQuery({ queryKey: ['me', 'links'], queryFn: () => api.me.links(undefined, { limit: 50 }) })
  return useMemo(
    () => [
      {
        title: '북마크 공고',
        items: (bookmarks.data?.data ?? []).map((p) => ({ id: p.id, kind: 'job' as const, title: p.title, sub: `${p.company} · ${p.location}`, tag: p.company.slice(0, 1) })),
      },
      {
        title: '마이 › 서류',
        items: (docs.data ?? []).map((d) => ({ id: d.id, kind: 'doc' as const, title: d.fileName, sub: d.aiMade ? 'AI로 만듦' : `${Math.round(d.size / 1000)}KB`, tag: d.fileName.split('.').pop()!.toUpperCase() })),
      },
      {
        title: '내 링크',
        items: (links.data?.data ?? []).map((l) => ({ id: l.id, kind: 'link' as const, title: l.title, sub: l.url.replace(/^https?:\/\//, '') })),
      },
      { title: '바로가기', items: QUICK_STARTS.map((q) => ({ id: q.key, kind: 'shortcut' as const, title: q.label, sub: '' })) },
    ],
    [bookmarks.data, docs.data, links.data],
  )
}

function MentionPopover({ query, onPick }: { query: string; onPick: (m: MentionItem) => void }) {
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

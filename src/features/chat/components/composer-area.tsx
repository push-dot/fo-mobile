import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { brandOf } from '@push/shared'
import { Alert, Platform, Pressable, ScrollView, View, useWindowDimensions, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MAX_BYTES, SIZE_LIMIT, type PickedFile } from '@/features/my'
import { onAccent, radius, spacing, useColors, useShadow } from '../../../theme'
import { Chip, Icon, Text, useKeyboardHeight, type IconName } from '@/shared/components'
import { pickDocument } from '../../../shared/infrastructure'
import { useAccessMode, useMentionGroups } from '../api/hooks'
import { Composer } from './composer'
import { filterMentions, insertMention, mentionMaxHeight, mentionQuery, type MentionItem } from '../utils/mentions'
import { Appear } from './motion'
import Mark from './mark'
import { CHAT_ATTACHMENT_OPTIONS, MENTION_SHORTCUT_KEYS, QUICK_STARTS, type QuickStart } from '../constants'
import { useMaterialBridge } from '../stores'
import { materialsPath, quickStartPath } from '../utils/sheet-routes'

type Props = {
  placeholder: string
  onSend: (text: string, attachment?: PickedFile) => void
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
export const ComposerArea = ({ placeholder, onSend, working, onStop, onTyping, above, inputRef }: Props) => {
  const [text, setText] = useState('')
  const [file, setFile] = useState<PickedFile>()
  const own = useRef<TextInputInstance>(null)
  const attachRef = useRef<() => Promise<void>>(async () => undefined)
  const ref = inputRef ?? own
  const query = mentionQuery(text)
  const access = useAccessMode()

  const change = (t: string) => {
    setText(t)
    onTyping?.(t.length > 0)
  }
  const submit = () => {
    if (!text.trim()) return
    onSend(text.trim(), file)
    change('')
    setFile(undefined)
  }
  const attachFile = useCallback(async () => {
    const r = await pickDocument(CHAT_ATTACHMENT_OPTIONS)
    const asset = r.canceled ? undefined : r.assets[0]
    if (!asset) return
    if ((asset.size ?? 0) > MAX_BYTES) {
      Alert.alert(SIZE_LIMIT.title, SIZE_LIMIT.body)
      return
    }
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size })
  }, [])
  useEffect(
    () => {
      attachRef.current = attachFile
      return useMaterialBridge.subscribe((state, prev) => {
        if (state.text && state.text !== prev.text) {
          const value = state.text
          useMaterialBridge.setState({ text: null })
          setText((current) => (current ? `${current} ${value}` : value))
          onTyping?.(true)
        }
        if (state.file > prev.file) void attachRef.current()
      })
    },
    [attachFile, onTyping],
  )
  const pick = (m: MentionItem) => {
    if (m.kind === 'shortcut') {
      change(text.replace(/@([^\s@]*)$/, ''))
      const qs = QUICK_STARTS.find((q) => q.key === m.id)
      if (qs) router.push(quickStartPath(qs.key))
      return
    }
    change(insertMention(text, m.title))
  }

  return (
    <View style={{ gap: spacing[2] }}>
      {query !== null ? <MentionPopover query={query} onPick={pick} /> : above}
      <Composer
        inputRef={ref}
        value={text}
        onChangeText={change}
        onSend={submit}
        placeholder={placeholder}
        working={working}
        onStop={onStop}
        onAttach={() => router.push(materialsPath())}
        // Inserting "@" opens the suggestions right away.
        onMention={() => (change(text && !/\s$/.test(text) ? `${text} @` : `${text}@`), ref.current?.focus())}
        // shortcut: no speech dependency; the keyboard's dictation key handles voice for now.
        onMic={() => ref.current?.focus()}
        attachment={file?.name}
        onClearAttachment={() => setFile(undefined)}
        accessMode={access.mode}
      />
    </View>
  )
}

const SHORTCUT_ICON: Record<(typeof MENTION_SHORTCUT_KEYS)[number], IconName> = { link: 'link', gap: 'search', fit: 'chart' }

const MentionPopover = ({ query, onPick }: { query: string; onPick: (m: MentionItem) => void }) => {
  const c = useColors()
  const shadow = useShadow()
  const ios = Platform.OS === 'ios'
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const maxHeight = mentionMaxHeight(height, insets.top, keyboard || insets.bottom + spacing[4])
  const groups = filterMentions(useMentionGroups(), query)
  const firstId = query ? groups.find((g) => g.items[0]?.kind !== 'shortcut')?.items[0]?.id : undefined
  return (
    <Appear duration={250}>
      <View style={[shadow.pop, { borderRadius: ios ? 26 : radius.lg, backgroundColor: ios ? c.bg : c.card, borderWidth: 1, borderColor: c.line, elevation: 8, overflow: 'hidden' }]}>
        <ScrollView style={{ maxHeight }} contentContainerStyle={{ padding: spacing[2] }} keyboardShouldPersistTaps="always">
          {groups.length === 0 ? (
            <Text v="b2" color="t3" style={{ padding: 10 }}>
              “{query}”에 맞는 항목이 없어요
            </Text>
          ) : (
            groups.map((g) => (
              <View key={g.title}>
                <Text v="c2" weight="700" color="t3" style={{ paddingTop: spacing[2], paddingHorizontal: 10, paddingBottom: spacing[1] }}>
                  {g.title}
                </Text>
                {g.items[0]?.kind === 'shortcut' ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[1] }}>
                    {g.items.map((m) => (
                      <Chip key={m.id} label={m.title} onPress={() => onPick(m)} lead={<Icon name={SHORTCUT_ICON[m.id as keyof typeof SHORTCUT_ICON] ?? 'spark'} size={15} color="t2" />} />
                    ))}
                  </ScrollView>
                ) : (
                  g.items.map((m) => (
                    <Pressable
                      key={m.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${g.title}, ${m.title}`}
                      onPress={() => onPick(m)}
                      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: 10, borderRadius: radius.sm, backgroundColor: m.id === firstId || pressed ? c.fill : 'transparent' })}
                    >
                      {m.kind === 'job' ? <Mark text={m.tag ?? ''} color={brandOf(m.tag ?? '')} size={36} /> : null}
                      {m.kind === 'link' ? (
                        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: brandOf(m.title), alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="brief" size={18} color={onAccent} />
                        </View>
                      ) : null}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text v="b2" weight="600" numberOfLines={1} style={{ lineHeight: 21 }}>
                          {m.title}
                        </Text>
                        {m.sub ? (
                          <Text v="c2" color="t3" numberOfLines={1} style={{ lineHeight: 21 }}>
                            {m.sub}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Appear>
  )
}

import { router } from 'expo-router'
import { useEffect, useRef, type ReactNode } from 'react'
import { View, type TextInputInstance } from 'react-native'
import { materialPickerPath as botMaterialPath, type BotId } from '@/features/bots'
import type { PickedFile } from '@/features/my'
import { spacing } from '../../../theme'
import { useAccessMode } from '../api/hooks'
import { Composer } from './composer'
import { insertMention, mentionQuery, type MentionItem } from '../utils/mentions'
import MentionPopover from './mention-popover'
import { QUICK_STARTS, type QuickStart } from '../constants'
import { LOCAL_DRAFT, clearDraft, detachDraft, setDraftText, useDraftStore } from '../stores'
import { materialPickerPath, quickStartPath } from '../utils/sheet-routes'

type Props = {
  botId?: string
  placeholder: string
  onSend: (text: string, attachment?: PickedFile | string) => void
  working?: boolean
  onStop?: () => void
  /** Picked a 바로가기 from the @ list. */
  onShortcut: (qs: QuickStart) => void
  /** Reports typing so the first screen can hide its quick-start pills. */
  onTyping?: (typing: boolean) => void
  /** Floats above the box (StatusRow). */
  above?: ReactNode
  inputRef?: React.RefObject<TextInputInstance | null>
  /** First screen only (see ComposerProps.roomy). */
  roomy?: boolean
  disabled?: boolean
}

/** Composer + @ 언급 popover + attachment. Same on the first screen and in conversations. */
export const ComposerArea = ({ botId, placeholder, onSend, working, onStop, onTyping, above, inputRef, roomy, disabled }: Props) => {
  const id = botId ?? LOCAL_DRAFT
  const draft = useDraftStore((s) => s.byBot[id])
  const text = draft?.text ?? ''
  const own = useRef<TextInputInstance>(null)
  const ref = inputRef ?? own
  const query = disabled ? null : mentionQuery(text)
  const access = useAccessMode()

  useEffect(() => {
    onTyping?.(text.length > 0)
  }, [onTyping, text])

  const change = (t: string) => setDraftText(id, t)
  const submit = () => {
    const value = text.trim()
    if (!value) return
    onSend(value, draft?.file ?? draft?.chip)
    clearDraft(id)
  }
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
        roomy={roomy}
        value={text}
        onChangeText={change}
        onSend={submit}
        placeholder={placeholder}
        working={working}
        onStop={onStop}
        onAttach={() => router.push(botId ? botMaterialPath(botId as BotId) : materialPickerPath())}
        // Inserting "@" opens the suggestions right away.
        onMention={() => (change(text && !/\s$/.test(text) ? `${text} @` : `${text}@`), ref.current?.focus())}
        // shortcut: no speech dependency; the keyboard's dictation key handles voice for now.
        onMic={() => ref.current?.focus()}
        attachment={draft?.file?.name ?? draft?.chip}
        onClearAttachment={() => detachDraft(id)}
        accessMode={access.mode}
        disabled={disabled}
      />
    </View>
  )
}

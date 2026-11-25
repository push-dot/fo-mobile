import { router } from 'expo-router'
import { useEffect, useRef, type ReactNode } from 'react'
import { View, type TextInputInstance } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { materialPickerPath as botMaterialPath, type BotId } from '@/features/bots'
import type { PickedFile } from '@/features/my'
import { Composer } from './composer-body'
import { insertMention, mentionQuery, type MentionItem } from '../utils/mentions'
import MentionPopover from './mention-popover'
import { LOCAL_DRAFT, clearDraft, detachDraft, setDraftText, useDraftStore } from '../stores'
import { materialPickerPath } from '../utils/sheet-routes'

type Props = {
  botId?: string
  placeholder: string
  onSend: (text: string, attachment?: PickedFile | string) => void
  working?: boolean
  onStop?: () => void
  onTyping?: (typing: boolean) => void
  above?: ReactNode
  inputRef?: React.RefObject<TextInputInstance | null>
  disabled?: boolean
}

export const ComposerArea = ({ botId, placeholder, onSend, working, onStop, onTyping, above, inputRef, disabled }: Props) => {
  const id = botId ?? LOCAL_DRAFT
  const draft = useDraftStore((s) => s.byBot[id])
  const text = draft?.text ?? ''
  const own = useRef<TextInputInstance>(null)
  const ref = inputRef ?? own
  const query = disabled ? null : mentionQuery(text)

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
    change(insertMention(text, m.title))
  }

  return (
    <View style={styles.area}>
      {query !== null ? <MentionPopover query={query} onPick={pick} /> : above}
      <Composer
        inputRef={ref}
        value={text}
        onChangeText={change}
        onSend={submit}
        placeholder={placeholder}
        working={working}
        onStop={onStop}
        onAttach={() => router.push(botId ? botMaterialPath(botId as BotId) : materialPickerPath())}
        onMention={() => (change(text && !/\s$/.test(text) ? `${text} @` : `${text}@`), ref.current?.focus())}
        attachment={draft?.file?.name ?? draft?.chip}
        onClearAttachment={() => detachDraft(id)}
        disabled={disabled}
      />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  area: { gap: theme.spacing[2] },
}))

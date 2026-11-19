import { create } from 'zustand'
import type { Attachment, AttachmentKind, BotId } from '@/features/bots'
import type { PickedFile } from '@/features/my/types'
import { withMaterial } from '../utils/usage'

export const LOCAL_DRAFT = 'local'

type Draft = { text: string; file?: PickedFile; chip?: string; chipKind?: AttachmentKind; chipId?: string }

const EMPTY_DRAFT: Draft = { text: '' }

export const useDraftStore = create<{ byBot: Record<string, Draft> }>(() => ({ byBot: {} }))

const writeDraft = (id: string, next: Draft | undefined) => {
  useDraftStore.setState((s) => {
    if (!next) {
      if (!s.byBot[id]) return s
      const { [id]: _, ...rest } = s.byBot
      return { byBot: rest }
    }
    return { byBot: { ...s.byBot, [id]: next } }
  })
}

export const setDraftText = (id: string, text: string) => {
  useDraftStore.setState((s) => {
    const current = s.byBot[id] ?? EMPTY_DRAFT
    if (!text && !current.file && !current.chip) {
      if (!s.byBot[id]) return s
      const { [id]: _, ...rest } = s.byBot
      return { byBot: rest }
    }
    return { byBot: { ...s.byBot, [id]: { ...current, text } } }
  })
}

export const appendDraftText = (id: string, text: string) => {
  useDraftStore.setState((s) => ({ byBot: withMaterial(s.byBot, id, text, EMPTY_DRAFT) }))
}

export const attachDraftFile = (id: string, file: PickedFile) => {
  useDraftStore.setState((s) => {
    const current = s.byBot[id] ?? EMPTY_DRAFT
    return { byBot: { ...s.byBot, [id]: { ...current, file, chip: undefined, chipKind: undefined, chipId: undefined } } }
  })
}

export const attachDraftChip = (id: string, chip: string, chipKind: AttachmentKind, chipId?: string) => {
  useDraftStore.setState((s) => {
    const current = s.byBot[id] ?? EMPTY_DRAFT
    return { byBot: { ...s.byBot, [id]: { ...current, chip, chipKind, chipId, file: undefined } } }
  })
}

export const detachDraft = (id: string) => {
  useDraftStore.setState((s) => {
    const current = s.byBot[id]
    if (!current) return s
    if (!current.text) {
      const { [id]: _, ...rest } = s.byBot
      return { byBot: rest }
    }
    return { byBot: { ...s.byBot, [id]: { text: current.text } } }
  })
}

export const clearDraft = (id: string) => writeDraft(id, undefined)

export const attach = (botId: BotId, attachment: Attachment) => attachDraftChip(botId, attachment.title, attachment.kind, attachment.id)

export const resetDrafts = () => useDraftStore.setState({ byBot: {} })

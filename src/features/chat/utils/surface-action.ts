import type { A2uiLocal } from '@/shared/components'
import { applyText, SAVE_RETRY_TEXT } from '../constants'
import type { ChatState, DiffLine } from '../types'
import { applyCompany, choicesOf, diffLinesOf, documentOf, type SurfaceItem } from './surface'

export type SurfaceActionEffects = {
  send: (text: string) => void
  openDocument: (documentId: string) => void
  openReview: (lines: DiffLine[]) => void
  openPlan: () => void
  openPosting: (postingId: string) => void
  share: (documentId: string, name?: string) => void
  convert: (documentId: string) => void
  change: (label: string) => void
}

export const runSurfaceAction = (chat: ChatState, item: SurfaceItem, action: A2uiLocal, fx: SurfaceActionEffects) => {
  const doc = documentOf(item)
  const busy = chat.working !== null || chat.queue.length > 0
  switch (action.name) {
    case 'open_review': {
      const lines = diffLinesOf(item, action.documentId)
      if (lines) fx.openReview(lines)
      else fx.openDocument(action.documentId)
      return
    }
    case 'share':
      fx.share(action.documentId, doc?.name)
      return
    case 'open_plan':
      fx.openPlan()
      return
    case 'open_posting':
      fx.openPosting(action.postingId)
      return
    case 'change': {
      const row = choicesOf(item).find((c) => c.id === action.optionId)
      if (row?.label) fx.change(row.label)
      return
    }
    case 'result_action':
      switch (action.id) {
        case 'apply':
          if (!busy) fx.send(applyText(applyCompany(doc?.actions?.find((a) => a.id === 'apply')?.label)))
          return
        case 'convert':
          if (doc?.documentId) fx.convert(doc.documentId)
          return
        case 'view':
          if (doc?.documentId) fx.openDocument(doc.documentId)
          return
        case 'retry_save': {
          const newest = chat.items.findLast((x) => x.type === 'surface' && x.kind === 'result')
          if (!busy && newest?.id === item.id) fx.send(SAVE_RETRY_TEXT)
          return
        }
      }
  }
}

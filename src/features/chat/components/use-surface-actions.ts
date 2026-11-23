import { router } from 'expo-router'
import { accountPath } from '@/features/bots'
import { useConvertDocument } from '@/features/my'
import type { A2uiLocal } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { useShareFile } from '../api/hooks'
import { applyText, SAVE_RETRY_TEXT } from '../constants'
import { showReviewPage } from '../review-page'
import { send, useChatStore } from '../stores'
import { applyCompany, choicesOf, diffLinesOf, documentOf, hasMaterialRow, type SurfaceItem } from '../utils/surface'
import { useMaterialChange } from './use-material-change'

const openDocument = (documentId: string) => router.push(`/docs/push/${documentId}`)

/**
 * The local actions a surface dispatches, run by the app's own code. None reaches the server, and `result_action` runs only
 * its allowlisted ids (checked by the wrapper); a method or path a surface names is never called.
 */
export const useSurfaceActions = (botId: string, onSay: () => void) => {
  const share = useShareFile()
  const convert = useConvertDocument(openDocument)
  const materials = useChatStore((s) => {
    const chat = s.chats[botId]
    const waiting = chat?.items.find((item): item is SurfaceItem => item.type === 'surface' && item.id === chat.waiting)
    return !!waiting && hasMaterialRow(waiting)
  })
  const change = useMaterialChange(botId, onSay, materials)

  return (item: SurfaceItem, action: A2uiLocal) => {
    const doc = documentOf(item)
    switch (action.name) {
      case 'open_review': {
        // An edit opens on the review page with its lines; a saved 서류 opens itself.
        const lines = diffLinesOf(item, action.documentId)
        if (lines) showReviewPage({ lines })
        else openDocument(action.documentId)
        return
      }
      case 'share':
        share.mutate({ documentId: action.documentId, ...(doc?.name ? { name: doc.name } : {}) })
        return
      case 'open_plan':
        router.push(accountPath('plan'))
        return
      case 'open_posting':
        router.push(`/postings/${action.postingId}`)
        return
      case 'change': {
        const row = choicesOf(item).find((c) => c.id === action.optionId)
        if (row?.label) change(displayName(row.label))
        return
      }
      case 'result_action':
        switch (action.id) {
          case 'apply':
            send(botId, applyText(applyCompany(doc?.actions?.find((a) => a.id === 'apply')?.label)))
            return
          case 'convert':
            if (doc?.documentId && !convert.isPending) convert.mutate(doc.documentId)
            return
          case 'view':
            if (doc?.documentId) openDocument(doc.documentId)
            return
          case 'retry_save':
            send(botId, SAVE_RETRY_TEXT)
            return
        }
    }
  }
}

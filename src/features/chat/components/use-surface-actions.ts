import { router } from 'expo-router'
import { accountPath } from '@/features/bots'
import { useConvertDocument } from '@/features/my'
import type { A2uiLocal } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { useShareFile } from '../api/hooks'
import { showReviewPage } from '../review-page'
import { send, useChatStore } from '../stores'
import { emptyChat } from '../utils/reducer'
import { runSurfaceAction } from '../utils/surface-action'
import { hasMaterialRow, type SurfaceItem } from '../utils/surface'
import { useMaterialChange } from './use-material-change'

const openDocument = (documentId: string) => router.push(`/docs/push/${documentId}`)

export const useSurfaceActions = (botId: string, onSay: () => void) => {
  const share = useShareFile()
  const convert = useConvertDocument(openDocument)
  const materials = useChatStore((s) => {
    const chat = s.chats[botId]
    const waiting = chat?.items.find((item): item is SurfaceItem => item.type === 'surface' && item.id === chat.waiting)
    return !!waiting && hasMaterialRow(waiting)
  })
  const change = useMaterialChange(botId, onSay, materials)

  return (item: SurfaceItem, action: A2uiLocal) =>
    runSurfaceAction(useChatStore.getState().chats[botId] ?? emptyChat, item, action, {
      send: (text) => send(botId, text),
      openDocument,
      openReview: (lines) => showReviewPage({ lines }),
      openPlan: () => router.push(accountPath('plan')),
      openPosting: (postingId) => router.push(`/postings/${postingId}`),
      share: (documentId, name) => share.mutate({ documentId, ...(name ? { name } : {}) }),
      convert: (documentId) => {
        if (!convert.isPending) convert.mutate(documentId)
      },
      change: (label) => change(displayName(label)),
    })
}

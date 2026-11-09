import { create } from 'zustand'
import { queryClient } from '@/providers/query-client'
import { TOAST_ABOVE, showToast } from '@/shared/components'
import { myApi } from './api'
import { UNDO_MS } from './constants'
import type { MySource } from './types'
import { createUndo, deleteDocCopy, RETRY_LABEL } from './utils'

export const useDocImport = create<{ requested: boolean }>(() => ({ requested: false }))

export const useDocDelete = create<{ doc: Pick<MySource, 'id' | 'fileName'> | null }>(() => ({ doc: null }))

// Lives outside any screen so leaving the screen keeps the undo window and its toast in step.
export const usePendingDelete = create<{ hidden: string[] }>(() => ({ hidden: [] }))

const unhide = (id: string) => usePendingDelete.setState((s) => ({ hidden: s.hidden.filter((h) => h !== id) }))

const remove = (id: string) => {
  void myApi
    .remove(id)
    .then(() => queryClient.invalidateQueries({ queryKey: ['me', 'sources'] }))
    .catch(() =>
      showToast({
        message: deleteDocCopy('').failed,
        alert: true,
        opaque: true,
        bottom: TOAST_ABOVE.tabs,
        action: { label: RETRY_LABEL, onPress: () => remove(id) },
      }),
    )
    .finally(() => unhide(id))
}

const pending = createUndo(remove, UNDO_MS)

export const deleteWithUndo = (doc: Pick<MySource, 'id' | 'fileName'>) => {
  const copy = deleteDocCopy(doc.fileName)
  pending.start(doc.id)
  usePendingDelete.setState((s) => ({ hidden: [...s.hidden, doc.id] }))
  showToast({
    bottom: TOAST_ABOVE.tabs,
    message: copy.toast,
    action: {
      label: copy.undo,
      onPress: () => {
        pending.cancel()
        unhide(doc.id)
      },
    },
  })
}

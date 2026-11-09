import { create } from 'zustand'
import { queryClient } from '@/providers/query-client'
import { showToast } from '@/shared/components'
import { myApi } from './api'
import { UNDO_MS } from './constants'
import type { MySource } from './types'
import { createUndo, deleteDocCopy, RETRY_LABEL } from './utils'

export const useDocImport = create<{ requested: boolean }>(() => ({ requested: false }))

export const useDocDelete = create<{ doc: Pick<MySource, 'id' | 'fileName'> | null }>(() => ({ doc: null }))

// Lives outside any screen so leaving the screen keeps the undo window and its toast in step.
export const usePendingDelete = create<{ hidden: string[] }>(() => ({ hidden: [] }))

const unhide = (id: string) => usePendingDelete.setState((s) => ({ hidden: s.hidden.filter((h) => h !== id) }))

// Failed deletes wait here while another doc's 되돌리기 toast is up, so the failure toast never takes its place.
let failed: { ids: string[]; bottom?: number } = { ids: [] }

const showFailed = () => {
  if (!failed.ids.length || pending.busy()) return
  const { ids, bottom } = failed
  failed = { ids: [] }
  showToast({
    message: deleteDocCopy('').failed,
    alert: true,
    opaque: true,
    bottom,
    action: { label: RETRY_LABEL, onPress: () => ids.forEach((id) => remove(id, bottom)) },
  })
}

const remove = (id: string, bottom?: number) => {
  void myApi
    .remove(id)
    .then(() => queryClient.invalidateQueries({ queryKey: ['me', 'sources'] }))
    .catch(() => {
      failed = { ids: [...failed.ids, id], bottom }
      showFailed()
    })
    .finally(() => unhide(id))
}

// One window at a time, so the open window's toast bottom is a single value.
let undoBottom: number | undefined

const pending = createUndo((id) => {
  remove(id, undoBottom)
  // A new delete commits the open one and starts its own window in the same tick; a microtask later tells the two apart.
  queueMicrotask(showFailed)
}, UNDO_MS)

/** Hides the doc and offers 되돌리기 for UNDO_MS, then deletes it. `bottom` places the toasts (TOAST_ABOVE). */
export const deleteWithUndo = (doc: Pick<MySource, 'id' | 'fileName'>, bottom?: number) => {
  const copy = deleteDocCopy(doc.fileName)
  pending.start(doc.id)
  undoBottom = bottom
  usePendingDelete.setState((s) => ({ hidden: [...s.hidden, doc.id] }))
  showToast({
    bottom,
    message: copy.toast,
    action: {
      label: copy.undo,
      onPress: () => {
        pending.cancel()
        unhide(doc.id)
        showFailed()
      },
    },
  })
}

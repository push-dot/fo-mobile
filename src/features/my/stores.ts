import { ApiError } from '@push/api-client'
import { create } from 'zustand'
import { queryClient } from '@/providers/query-client'
import { showToast } from '@/shared/components'
import { myApi } from './api'
import { UNDO_MS } from './constants'
import type { MySource } from './types'
import { createUndo, DELETE_REFERENCED, deleteDocCopy, RESTORE_FAILED, RETRY_LABEL } from './utils'

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

// Push documents (origin AI) pending delete; they archive instead of DELETE sources/:id.
const pushDocs = new Set<string>()

const referencedByEvidence = (error: unknown) =>
  error instanceof ApiError && error.status === 409 && error.details?.reason === 'REFERENCED_BY_EVIDENCE'

// One settled result per id, so 되돌리기 after the commit can wait for the archive and then restore.
const removals = new Map<string, Promise<boolean>>()
const marks = new Map<string, { committed: boolean }>()

const remove = (id: string, bottom?: number) => {
  const push = pushDocs.has(id)
  const job = (push ? myApi.archive(id) : myApi.remove(id))
    .then(() => {
      pushDocs.delete(id)
      if (push) void queryClient.invalidateQueries({ queryKey: ['documents'] })
      return queryClient.invalidateQueries({ queryKey: ['me', 'sources'] }).then(() => true)
    })
    .catch((error: unknown) => {
      if (referencedByEvidence(error)) showToast({ message: DELETE_REFERENCED, alert: true, opaque: true, bottom })
      else {
        failed = { ids: [...failed.ids, id], bottom }
        showFailed()
      }
      return false
    })
    .finally(() => unhide(id))
  removals.set(id, job)
}

const restoreArchived = (id: string) => {
  const job = removals.get(id)
  if (!job) return
  void job.then((archived) => {
    if (!archived) return
    return myApi
      .restore(id)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['documents'] })
        return queryClient.invalidateQueries({ queryKey: ['me', 'sources'] })
      })
      .catch(() => showToast({ message: RESTORE_FAILED, alert: true }))
  })
}

// One window at a time, so the open window's toast bottom is a single value.
let undoBottom: number | undefined

const pending = createUndo((id) => {
  const mark = marks.get(id)
  if (mark) mark.committed = true
  remove(id, undoBottom)
  // A new delete commits the open one and starts its own window in the same tick; a microtask later tells the two apart.
  queueMicrotask(showFailed)
}, UNDO_MS)

/** Hides the doc and offers 되돌리기 for UNDO_MS, then deletes it. `bottom` places the toasts (TOAST_ABOVE). */
export const deleteWithUndo = (doc: Pick<MySource, 'id' | 'fileName'> & { aiMade?: boolean }, bottom?: number) => {
  const copy = deleteDocCopy(doc.fileName)
  const mark = { committed: false }
  if (doc.aiMade) pushDocs.add(doc.id)
  // start() commits the previous window before this mark is stored, so the two stay apart.
  pending.start(doc.id)
  marks.set(doc.id, mark)
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
        // The window already fired: a Push document is archived, so 되돌리기 brings that revision back.
        if (mark.committed) {
          if (doc.aiMade) restoreArchived(doc.id)
        } else pushDocs.delete(doc.id)
        showFailed()
      },
    },
  })
}

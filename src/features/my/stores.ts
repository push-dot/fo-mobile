import { ApiError } from '@push/api-client'
import { create } from 'zustand'
import { queryClient } from '@/providers/query-client'
import { showToast } from '@/shared/components'
import { myApi } from './api'
import { UNDO_MS } from './constants'
import type { MySource } from './types'
import { createUndo, DELETE_REFERENCED, deleteDocCopy, RESTORE_FAILED, RETRY_LABEL } from './utils'

export const useCalendarDay = create<{ day: Date }>(() => ({ day: new Date() }))

export const useDocImport = create<{ requested: boolean }>(() => ({ requested: false }))

export const useDocDelete = create<{ doc: Pick<MySource, 'id' | 'fileName'> | null }>(() => ({ doc: null }))

export const usePendingDelete = create<{ hidden: string[] }>(() => ({ hidden: [] }))

const unhide = (id: string) => usePendingDelete.setState((s) => ({ hidden: s.hidden.filter((h) => h !== id) }))

let failed: { ids: string[]; bottom?: number } = { ids: [] }

const showFailed = () => {
  if (!failed.ids.length || pending.busy()) return
  const { ids, bottom } = failed
  failed = { ids: [] }
  showToast({
    message: deleteDocCopy('').failed,
    alert: true,
    bottom,
    action: { label: RETRY_LABEL, onPress: () => ids.forEach((id) => remove(id, bottom)) },
  })
}

const pushDocs = new Set<string>()

const referencedByEvidence = (error: unknown) =>
  error instanceof ApiError && error.status === 409 && error.details?.reason === 'REFERENCED_BY_EVIDENCE'

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
      if (referencedByEvidence(error)) showToast({ message: DELETE_REFERENCED, alert: true, bottom })
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
  removals.delete(id)
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

let undoBottom: number | undefined

const pending = createUndo((id) => {
  const mark = marks.get(id)
  if (mark) mark.committed = true
  marks.delete(id)
  remove(id, undoBottom)
  queueMicrotask(showFailed)
}, UNDO_MS)

export const deleteWithUndo = (doc: Pick<MySource, 'id' | 'fileName'> & { aiMade?: boolean }, bottom?: number) => {
  const copy = deleteDocCopy(doc.fileName)
  const mark = { committed: false }
  if (doc.aiMade) pushDocs.add(doc.id)
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
        if (mark.committed) {
          if (doc.aiMade) restoreArchived(doc.id)
        } else pushDocs.delete(doc.id)
        showFailed()
      },
    },
  })
}

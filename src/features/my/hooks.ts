import { useIsFocused } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { askConfirm, showToast } from '@/shared/components'
import { pickDocument } from '@/shared/infrastructure'
import { useRemoveSource } from './api/hooks'
import { MAX_BYTES, RESUME_DOCUMENT_OPTIONS, UNDO_MS } from './constants'
import type { PickedFile } from './types'
import { useDocDelete } from './stores'
import { deleteDocCopy, SIZE_LIMIT } from './utils'

export const useUndoRemove = (onRemoved?: () => void) => {
  const remove = useRemoveSource(() => onRemoved?.())
  const [hiddenId, setHiddenId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const confirm = (doc: { id: string; fileName: string }) => {
    const copy = deleteDocCopy(doc.fileName)
    if (timer.current) clearTimeout(timer.current)
    setHiddenId(doc.id)
    showToast({
      message: copy.toast,
      action: {
        label: copy.undo,
        onPress: () => {
          if (timer.current) clearTimeout(timer.current)
          timer.current = null
          setHiddenId(null)
        },
      },
    })
    timer.current = setTimeout(() => {
      timer.current = null
      remove.mutate(doc.id)
      setHiddenId(null)
    }, UNDO_MS)
  }
  const ask = (doc: { id: string; fileName: string }) => {
    const copy = deleteDocCopy(doc.fileName)
    askConfirm({ title: copy.title, body: copy.body, confirm: copy.confirm, cancel: copy.cancel, danger: true, onConfirm: () => confirm(doc) })
  }
  const focused = useIsFocused()
  const requested = useDocDelete((st) => st.doc)
  useEffect(() => {
    if (!focused || !requested) return
    useDocDelete.setState({ doc: null })
    ask(requested)
  })
  return { hiddenId, ask }
}

export const pickResume = async (): Promise<PickedFile | null> => {
  const res = await pickDocument(RESUME_DOCUMENT_OPTIONS)
  const file = res.canceled ? null : res.assets[0]
  if (!file) return null
  if ((file.size ?? 0) > MAX_BYTES) {
    showToast({ message: SIZE_LIMIT.title, tone: 'error' })
    return null
  }
  return file
}

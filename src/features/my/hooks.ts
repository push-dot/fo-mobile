import { useCallback, useEffect, useRef, useState } from 'react'
import { askConfirm } from '@/shared/components'
import { useRemoveSource } from './api/hooks'
import { deleteDocCopy } from './utils'

type ToastAction = { label: string; onPress: () => void }

export const useToast = () => {
  const [text, setText] = useState<string | null>(null)
  const [action, setAction] = useState<ToastAction | null>(null)
  const [error, setError] = useState(false)
  const hide = useCallback(() => {
    setText(null)
    setAction(null)
    setError(false)
  }, [])
  const show = useCallback((next: string, extra?: { action: string; onAction: () => void }) => {
    setText(next)
    setAction(extra ? { label: extra.action, onPress: extra.onAction } : null)
    setError(false)
  }, [])
  const fail = useCallback((next: string) => {
    setText(next)
    setAction(null)
    setError(true)
  }, [])
  return { text, action, error, show, fail, hide }
}

export const useUndoRemove = (onRemoved?: () => void) => {
  const remove = useRemoveSource(() => onRemoved?.())
  const toast = useToast()
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
    toast.show(copy.toast, {
      action: copy.undo,
      onAction: () => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = null
        setHiddenId(null)
        toast.hide()
      },
    })
    timer.current = setTimeout(() => {
      timer.current = null
      remove.mutate(doc.id)
      setHiddenId(null)
    }, 2500)
  }
  const ask = (doc: { id: string; fileName: string }) => {
    const copy = deleteDocCopy(doc.fileName)
    askConfirm({ title: copy.title, body: copy.body, confirm: copy.confirm, cancel: copy.cancel, danger: true, onConfirm: () => confirm(doc) })
  }
  return { hiddenId, ask, toast }
}

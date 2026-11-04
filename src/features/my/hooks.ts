import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useRemoveSource } from './api/hooks'
import { deleteDocCopy } from './utils'

type ToastAction = { label: string; onPress: () => void }

export const useToast = () => {
  const [text, setText] = useState<string | null>(null)
  const [action, setAction] = useState<ToastAction | null>(null)
  const hide = useCallback(() => {
    setText(null)
    setAction(null)
  }, [])
  const show = useCallback((next: string, extra?: { action: string; onAction: () => void }) => {
    setText(next)
    setAction(extra ? { label: extra.action, onPress: extra.onAction } : null)
  }, [])
  return { text, action, show, hide }
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
  const ask = (doc: { id: string; fileName: string }) => {
    const copy = deleteDocCopy(doc.fileName)
    Alert.alert(copy.title, copy.body, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.confirm,
        style: 'destructive',
        onPress: () => {
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
        },
      },
    ])
  }
  return { hiddenId, ask, toast }
}

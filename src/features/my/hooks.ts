import { router, useIsFocused } from 'expo-router'
import { useEffect, useEffectEvent } from 'react'
import { TOAST_ABOVE, askConfirm, showToast, type ConfirmRequest } from '@/shared/components'
import { showChoiceModal } from '@/shared/navigation'
import { botChatPath } from '@/features/bots'
import { pickDocument } from '@/shared/infrastructure'
import { MAX_BYTES, RESUME_DOCUMENT_OPTIONS, SHEET_SWAP_MS } from './constants'
import type { PickedFile } from './types'
import { deleteWithUndo, useDocDelete, useDocImport, usePendingDelete } from './stores'
import { deleteDocCopy, SIZE_LIMIT } from './utils'

// A sheet only files the request; the screen under it acts on it `ms` after regaining focus, and drops it if it loses focus first.
const useSheetHandoff = <T,>(request: T | null | false, clear: () => void, fire: (request: T) => void, ms: number) => {
  const focused = useIsFocused()
  const onClear = useEffectEvent(clear)
  const onFire = useEffectEvent(fire)
  useEffect(() => {
    if (!focused || !request) return
    const timer = setTimeout(() => {
      onClear()
      onFire(request)
    }, ms)
    return () => {
      clearTimeout(timer)
      onClear()
    }
  }, [focused, request, ms])
}

export const useImportRequest = (onPick: () => void) =>
  useSheetHandoff(useDocImport((st) => st.requested), () => useDocImport.setState({ requested: false }), onPick, SHEET_SWAP_MS)

export const deleteConfirm = (doc: { fileName: string }, onConfirm: () => void): ConfirmRequest => {
  const { title, body, confirm, cancel } = deleteDocCopy(doc.fileName)
  return { title, body, confirm, cancel, danger: true, onConfirm }
}

export const useUndoRemove = (onStart?: () => void) => {
  const hidden = usePendingDelete((st) => st.hidden)
  const confirm = (doc: { id: string; fileName: string }) => {
    deleteWithUndo(doc, TOAST_ABOVE.tabs)
    onStart?.()
  }
  useSheetHandoff(useDocDelete((st) => st.doc), () => useDocDelete.setState({ doc: null }), confirm, 0)
  return hidden
}

export const pickResume = async (): Promise<PickedFile | null> => {
  const res = await pickDocument(RESUME_DOCUMENT_OPTIONS)
  const file = res.canceled ? null : res.assets[0]
  if (!file) return null
  if ((file.size ?? 0) > MAX_BYTES) {
    showToast({ message: SIZE_LIMIT.title, tone: 'error', bottom: TOAST_ABOVE.docsError })
    return null
  }
  return file
}

/** An uploaded file's ⋯ menu (MyResumeStates): 이름 변경 and 서류 삭제하기 in a regular modal; the delete confirm over the page stays an alert. */
export const useFileMenu = (file: { id: string; fileName: string } | undefined) => () => {
  if (!file) return
  showChoiceModal({
    title: file.fileName,
    items: [
      { label: '이름 변경', onPress: () => router.push(`/docs/${file.id}/rename`) },
      { label: '서류 삭제하기', destructive: true, onPress: () => askConfirm(deleteConfirm(file, () => useDocDelete.setState({ doc: file }))) },
    ],
  })
}

/** UploadPick: 파일 등록 asks where the 서류 comes from, in a regular modal. */
export const showImportMenu = () =>
  showChoiceModal({
    title: '서류 가져오기',
    message: 'PDF, DOCX · 20MB까지 올릴 수 있어요',
    items: [
      { label: '파일에서 고르기', onPress: () => useDocImport.setState({ requested: true }) },
      { label: 'Bot 채팅에서 새로 만들기', onPress: () => router.push(botChatPath('push')) },
    ],
  })

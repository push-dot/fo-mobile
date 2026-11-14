import { router, useIsFocused } from 'expo-router'
import { useEffect, useEffectEvent } from 'react'
import { Alert, Platform } from 'react-native'
import { TOAST_ABOVE, askConfirm, showActionSheet, showToast, type ConfirmRequest } from '@/shared/components'
import { botChatPath } from '@/features/bots'
import { pickDocument } from '@/shared/infrastructure'
import { MAX_BYTES, RESUME_DOCUMENT_OPTIONS, SHEET_SWAP_MS } from './constants'
import type { PickedFile } from './types'
import { deleteWithUndo, useDocDelete, useDocImport, usePendingDelete } from './stores'
import { useRenameSource } from './api/hooks'
import { clipTitle, deleteDocCopy, DOC_RENAME_COPY, renamedTitle, SIZE_LIMIT, SOURCE_NAME_MAX } from './utils'

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

/**
 * 이름 바꾸기 (PushDocRename, MyResumeStates): iOS asks in the system alert with a text field. Android has no such alert, so it
 * opens the sheet the caller names.
 */
export const askDocName = ({ title, current, max, onSave, fallback }: { title: string; current: string; max: number; onSave: (name: string) => void; fallback: () => void }) => {
  if (Platform.OS !== 'ios') return fallback()
  Alert.prompt(
    title,
    DOC_RENAME_COPY.description,
    [
      { text: DOC_RENAME_COPY.cancel, style: 'cancel' },
      {
        text: DOC_RENAME_COPY.save,
        onPress: (typed?: string) => {
          const next = renamedTitle(current, typed ?? '')
          if (next) onSave(clipTitle(next, max))
        },
      },
    ],
    'plain-text',
    current,
  )
}

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

/** An uploaded file's ⋯ menu (MyResumeStates): 이름 변경 and 서류 삭제하기, in the platform's action list. */
export const useFileMenu = (file: { id: string; fileName: string } | undefined) => {
  const rename = useRenameSource(file?.id)
  return () => {
    if (!file) return
    showActionSheet({
      title: file.fileName,
      items: [
        {
          label: '이름 변경',
          onPress: () =>
            askDocName({
              title: DOC_RENAME_COPY.fileTitle,
              current: file.fileName,
              max: SOURCE_NAME_MAX,
              onSave: (name) => rename.mutate(name, { onError: () => showToast({ message: DOC_RENAME_COPY.failed, alert: true }) }),
              fallback: () => router.push(`/docs/${file.id}/rename`),
            }),
        },
        { label: '서류 삭제하기', destructive: true, onPress: () => askConfirm(deleteConfirm(file, () => useDocDelete.setState({ doc: file }))) },
      ],
    })
  }
}

/** UploadPick: 파일 등록 asks where the 서류 comes from, in the platform's action list. */
export const showImportMenu = () =>
  showActionSheet({
    title: '서류 가져오기',
    message: 'PDF, DOCX · 20MB까지 올릴 수 있어요',
    items: [
      { label: '파일에서 고르기', onPress: () => useDocImport.setState({ requested: true }) },
      { label: 'Bot 채팅에서 새로 만들기', onPress: () => router.push(botChatPath('push')) },
    ],
  })

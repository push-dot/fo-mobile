import { Alert } from 'react-native'
import { showToast } from '@/shared/components'
import { useDeleteMaterial, useRestoreMaterial } from '../api/hooks'
import { CANCEL_LABEL, CITED, DELETE_CONFIRM, RESTORE_FAILED, UNDO_LABEL } from '../constants'
import type { Material } from '../types'
import { isCitedError } from '../utils/delete-error'
import { deleteCopy } from '../utils/material-view'

export const useConfirmDeleteMaterial = (toastBottom: number) => {
  const remove = useDeleteMaterial()
  const restore = useRestoreMaterial()
  return (m: Material) => {
    const copy = deleteCopy(m)
    const run = () =>
      remove(m.kind, m.id).then(
        () =>
          showToast({
            message: copy.done,
            bottom: toastBottom,
            action: {
              label: UNDO_LABEL,
              onPress: () => void restore(m.kind, m.id).catch(() => showToast({ message: RESTORE_FAILED, alert: true, bottom: toastBottom })),
            },
          }),
        (error: unknown) => showToast({ message: isCitedError(error) ? CITED : copy.failed, alert: true, bottom: toastBottom }),
      )
    Alert.alert(copy.title, copy.body, [
      { text: CANCEL_LABEL, style: 'cancel' },
      { text: DELETE_CONFIRM, style: 'destructive', onPress: () => void run() },
    ])
  }
}

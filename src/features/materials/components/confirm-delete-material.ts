import { ApiError } from '@push/api-client'
import { Alert } from 'react-native'
import { showToast } from '@/shared/components'
import { useDeleteMaterial, useRestoreMaterial } from '../api/hooks'
import { CANCEL_LABEL, CITED, DELETE_CONFIRM, RESTORE_FAILED, UNDO_LABEL } from '../constants'
import type { Material } from '../types'
import { deleteCopy } from '../utils/material-view'

/** DELETE answers 409 for a file a career row still cites. */
const cited = (error: unknown) => error instanceof ApiError && error.status === 409

/** MaterialDetailDelete: a native alert over the list. A long press on a row asks it; the detail sheet has no delete. */
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
        (error: unknown) => showToast({ message: cited(error) ? CITED : copy.failed, alert: true, bottom: toastBottom }),
      )
    Alert.alert(copy.title, copy.body, [
      { text: CANCEL_LABEL, style: 'cancel' },
      { text: DELETE_CONFIRM, style: 'destructive', onPress: () => void run() },
    ])
  }
}

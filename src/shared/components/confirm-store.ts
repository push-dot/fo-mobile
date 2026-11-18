import { Alert } from 'react-native'

export type ConfirmRequest = {
  title: string
  body: string
  /** A quieter line under the body. */
  note?: string
  confirm: string
  cancel?: string
  danger?: boolean
  onConfirm: () => void
}

/** The platform's own confirm: an iOS alert, an Android Material dialog (DeleteCareer, DeleteDoc, ...). `danger` makes the confirm button the red destructive one. */
export const askConfirm = (request: ConfirmRequest) =>
  Alert.alert(request.title, [request.body, request.note].filter(Boolean).join('\n\n'), [
    { text: request.cancel ?? '취소', style: 'cancel' },
    { text: request.confirm, style: request.danger ? 'destructive' : 'default', onPress: request.onConfirm },
  ])

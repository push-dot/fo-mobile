import { Alert } from 'react-native'

export type ConfirmRequest = {
  title: string
  body: string
  note?: string
  confirm: string
  cancel?: string
  danger?: boolean
  onConfirm: () => void
}

export const askConfirm = (request: ConfirmRequest) =>
  Alert.alert(request.title, [request.body, request.note].filter(Boolean).join('\n\n'), [
    { text: request.cancel ?? '취소', style: 'cancel' },
    { text: request.confirm, style: request.danger ? 'destructive' : 'default', onPress: request.onConfirm },
  ])

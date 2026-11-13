import { Alert } from 'react-native'
import { CANCEL_LABEL, DELETE_ACTION, DELETE_BODY, deleteTitle } from './profile-rows'

/** The native confirm dialog (rule 10): iOS alert on iOS, Material dialog on Android. */
export const confirmDeleteBot = (name: string, onDelete: () => void) =>
  Alert.alert(deleteTitle(name), DELETE_BODY, [
    { text: CANCEL_LABEL, style: 'cancel' },
    { text: DELETE_ACTION, style: 'destructive', onPress: onDelete },
  ])

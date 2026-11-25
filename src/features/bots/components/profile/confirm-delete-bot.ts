import { Alert, Platform } from 'react-native'
import { CANCEL_LABEL, DELETE_ACTION, DELETE_BODY, deleteTitle } from './profile-rows'

const ANDROID_BODY = '이 Bot과 나눈 대화와 작업 기록이 모두 지워지고 되돌릴 수 없어요. 내 서류에 저장한 파일은 그대로 남아요.'

export const confirmDeleteBot = (name: string, onDelete: () => void) =>
  Alert.alert(deleteTitle(name), Platform.OS === 'android' ? ANDROID_BODY : DELETE_BODY, [
    { text: CANCEL_LABEL, style: 'cancel' },
    { text: DELETE_ACTION, style: 'destructive', onPress: onDelete },
  ])

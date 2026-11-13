import { ActionSheetIOS, Alert, Platform } from 'react-native'

export type ActionSheetItem = { label: string; destructive?: boolean; onPress: () => void }

/** The platform's own action list: an iOS action sheet, an Android dialog with the actions as buttons (MyResumeStates, UploadPick). */
export const showActionSheet = ({ title, message, items, cancel = '취소' }: { title: string; message?: string; items: ActionSheetItem[]; cancel?: string }) => {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [...items.map((i) => i.label), cancel],
        cancelButtonIndex: items.length,
        destructiveButtonIndex: items.findIndex((i) => i.destructive) >= 0 ? items.findIndex((i) => i.destructive) : undefined,
      },
      (index) => items[index]?.onPress(),
    )
    return
  }
  Alert.alert(title, message, [
    ...items.map((i) => ({ text: i.label, style: i.destructive ? ('destructive' as const) : ('default' as const), onPress: i.onPress })),
    { text: cancel, style: 'cancel' as const },
  ])
}

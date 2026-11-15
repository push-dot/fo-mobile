import { Alert } from 'react-native'

type Copy = { title: string; body: string; more: string; detail: string; agree: string; later: string }

/** The reference-data consent as the platform's own alert; 자세히 보기 shows the detail in a second alert that asks again. */
export const showConsentAlert = (copy: Copy, { onAgree, onLater }: { onAgree: () => void; onLater: () => void }) => {
  const title = copy.title.replace('\n', ' ')
  const ask = (detail: boolean) =>
    Alert.alert(
      title,
      detail ? `${copy.body}\n\n${copy.detail}` : copy.body,
      [
        { text: copy.agree, isPreferred: true, onPress: onAgree },
        ...(detail ? [] : [{ text: copy.more, onPress: () => ask(true) }]),
        { text: copy.later, style: 'cancel' as const, onPress: onLater },
      ],
      { cancelable: true, onDismiss: onLater },
    )
  ask(false)
}

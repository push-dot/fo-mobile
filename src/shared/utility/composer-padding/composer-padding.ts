import { spacing } from '../../../theme/tokens'

const IOS_HOME_LIFT = 6

export const composerPadding = (ios: boolean, bottomInset: number, keyboardUp: boolean) => ({
  paddingHorizontal: spacing[3],
  paddingTop: ios ? IOS_HOME_LIFT : spacing[2],
  paddingBottom: ios
    ? keyboardUp
      ? Math.max(bottomInset - IOS_HOME_LIFT, spacing[2])
      : bottomInset + IOS_HOME_LIFT
    : (keyboardUp ? 0 : bottomInset) + spacing[2],
})

import { spacing } from '../../../theme/tokens'

// Last thread line to an approval sheet, calibrated on the device per platform.
const APPROVAL_GAP = { ios: 46, android: 30 }
const KEYBOARD_GAP = spacing[2]
const THREAD_GAP = spacing[4]

type Inset = { bottomH: number; keyboard: number; navBar: number; approval: boolean; android: boolean }

/** Android reports the keyboard without the nav bar, but KeyboardAvoidingView lifts the composer by both. */
export const threadInset = ({ bottomH, keyboard, navBar, approval, android }: Inset) => {
  const lift = keyboard && android ? keyboard + navBar : keyboard
  return bottomH + lift + (approval ? APPROVAL_GAP[android ? 'android' : 'ios'] : keyboard ? KEYBOARD_GAP : THREAD_GAP)
}

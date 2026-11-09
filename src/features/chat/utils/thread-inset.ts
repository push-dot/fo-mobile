import { spacing } from '../../../theme/tokens'

// Last thread line to an approval sheet: iOS calibrated on the device, Android the board's 25 (thread bottom 236 over a 211pt sheet).
const APPROVAL_GAP = { ios: 46, android: 25 }
const KEYBOARD_GAP = spacing[2]
const THREAD_GAP = spacing[4]
// The boards lift the thread 42pt for the status row on both platforms; the row stack is 36+8 on iOS and 28+8 on Android, so the gap is 14 and 22.
const STATUS_GAP = { ios: 14, android: 22 }

type Inset = { bottomH: number; keyboard: number; navBar: number; approval: boolean; android: boolean; status?: boolean }

/** Android reports the keyboard without the nav bar, but KeyboardAvoidingView lifts the composer by both. */
export const threadInset = ({ bottomH, keyboard, navBar, approval, android, status }: Inset) => {
  const lift = keyboard && android ? keyboard + navBar : keyboard
  const platform = android ? 'android' : 'ios'
  return bottomH + lift + (approval ? APPROVAL_GAP[platform] : keyboard ? KEYBOARD_GAP : status ? STATUS_GAP[platform] : THREAD_GAP)
}

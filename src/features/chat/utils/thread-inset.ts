import { spacing } from '../../../theme/tokens'

const APPROVAL_GAP = { ios: 46, android: 25 }
export const BUBBLE_GAP = 18
const KEYBOARD_GAP = spacing[2]
const THREAD_GAP = spacing[4]
const STATUS_GAP = { ios: 14, android: 22 }

type Inset = { bottomH: number; keyboard: number; navBar: number; approval: boolean; android: boolean; status?: boolean }

const extraGap = (approval: boolean, keyboard: number, status: boolean | undefined, platform: 'ios' | 'android') => {
  if (approval) return APPROVAL_GAP[platform]
  if (keyboard) return KEYBOARD_GAP
  if (status) return STATUS_GAP[platform]
  return THREAD_GAP
}

export const threadInset = ({ bottomH, keyboard, navBar, approval, android, status }: Inset) => {
  const lift = keyboard && android ? keyboard + navBar : keyboard
  const platform = android ? 'android' : 'ios'
  return bottomH + lift + extraGap(approval, keyboard, status, platform)
}

export const threadBottomGap = (keyboard: number) => (keyboard ? KEYBOARD_GAP : THREAD_GAP)

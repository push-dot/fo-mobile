import { TAB_CLEARANCE } from './copy'

export const barLift = (keyboard: number, ios: boolean) => (keyboard > 0 ? (ios ? keyboard + 8 : Math.max(0, keyboard - TAB_CLEARANCE)) : ios ? TAB_CLEARANCE + 8 : 8)

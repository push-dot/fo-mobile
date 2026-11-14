import { TAB_CLEARANCE } from './copy'

/**
 * How far the search bar rests above the screen's bottom edge. The iOS tab bar floats over the view, so the bar rests above it; with the
 * keyboard up it rests 8pt above the keyboard's frame, which already reaches that edge. Android's tab bar takes its own space.
 */
export const barLift = (keyboard: number, ios: boolean) => (keyboard > 0 ? (ios ? keyboard + 8 : Math.max(0, keyboard - TAB_CLEARANCE)) : ios ? TAB_CLEARANCE + 8 : 8)

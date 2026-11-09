import { TINTS } from '../constants'

/** Fallback colour for a person without a photo. Company tiles use brandColor from @push/shared, like the WebView. */
export const avatarTint = (name: string) =>
  TINTS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TINTS.length]!

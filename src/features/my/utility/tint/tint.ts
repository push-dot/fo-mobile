import { TINTS } from '../../constants'

export const tintOf = (seed: string) =>
  TINTS[[...seed].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TINTS.length]!

import type { Colors } from './tokens'

export const lineRing = (c: Pick<Colors, 'line'>) => ({ boxShadow: `0 0 0 1px ${c.line}` })

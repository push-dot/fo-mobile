import type { Colors } from './tokens'

/** The boards draw a card's 1pt line as `box-shadow: 0 0 0 1px`: it sits outside the layout box, a `borderWidth` would add 2pt to the box. */
export const lineRing = (c: Pick<Colors, 'line'>) => ({ boxShadow: `0 0 0 1px ${c.line}` })

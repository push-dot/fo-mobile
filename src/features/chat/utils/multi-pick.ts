import type { Choice } from '../types'

/** The row that ends a flow (닫기): a regular modal has no 취소 row, swiping it away is the way out (owner rule 35). */
export const isStop = (c: Choice) => c.label === '닫기' || c.label === '그만하기' || c.label === '그만할게요'

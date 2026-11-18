import type { Choice } from '../types'

export const isStop = (c: Choice) => c.label === '닫기' || c.label === '그만하기' || c.label === '그만할게요'

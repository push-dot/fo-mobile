import type { Colors } from './tokens'

export const selectedRing = (c: Pick<Colors, 'ac' | 'acSoft'>) => ({
  backgroundColor: c.acSoft,
  borderWidth: 1.5,
  borderColor: c.ac,
})

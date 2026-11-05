import type { Colors } from './tokens'

/** Canvas audit 2026-10. 1.5px inset ring: the border sits inside the existing box. */
export const selectedRing = (c: Pick<Colors, 'ac' | 'acSoft'>) => ({
  backgroundColor: c.acSoft,
  borderWidth: 1.5,
  borderColor: c.ac,
})

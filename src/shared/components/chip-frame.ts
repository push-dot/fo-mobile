import { selectedRing } from '../../theme/selected-ring'
import type { Colors } from '../../theme/tokens'

/** Selected chips take the audit ring. Unselected chips stay on the neutral fill. */
export const chipFrame = (on: boolean, c: Pick<Colors, 'ac' | 'acSoft' | 'fill'>) =>
  on ? { ...selectedRing(c), overflow: 'hidden' as const } : { backgroundColor: c.fill, overflow: 'hidden' as const }

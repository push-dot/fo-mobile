import type { Weight } from '@/theme/tokens'

/** CSS `bolder`, which the boards' <b> match uses: 400-500 → 700, 600+ → 900, drawn with the 800 face we bundle. */
export const bolder = (w: Weight): Weight => (Number(w) >= 600 ? '800' : '700')

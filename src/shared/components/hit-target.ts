/** Canvas audit 2026-10. Controls grow with large text; the floor is 48. */
export const HIT_TARGET = 48

/** Grows a control to the 48 hit area without resizing it (canvas audit: a 48px `:after` box over the control). */
export const hitSlopTo = (height: number, width = HIT_TARGET) => {
  const v = Math.max(0, (HIT_TARGET - height) / 2)
  const h = Math.max(0, (HIT_TARGET - width) / 2)
  return { top: v, bottom: v, left: h, right: h }
}

/** Status row keeps its visual floor and uses minHeight so the verb can grow. */
export const STATUS_ROW_MIN_HEIGHT = { ios: 36, android: 28 } as const

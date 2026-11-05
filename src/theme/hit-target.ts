export const HIT_TARGET = 48

export const hitSlopTo = (height: number, width = HIT_TARGET) => {
  const v = Math.max(0, (HIT_TARGET - height) / 2)
  const h = Math.max(0, (HIT_TARGET - width) / 2)
  return { top: v, bottom: v, left: h, right: h }
}

export const STATUS_ROW_MIN_HEIGHT = { ios: 36, android: 28 } as const

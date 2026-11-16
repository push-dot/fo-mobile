export const RECENT_LIMIT = 3
export const recent = <T>(list: readonly T[], limit = RECENT_LIMIT): T[] => list.slice(0, Math.max(limit, 0))

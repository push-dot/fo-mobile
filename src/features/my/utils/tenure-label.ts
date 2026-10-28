export const tenureLabel = (years: number | null) => (years == null ? '' : years <= 0 ? '신입' : `${years}년차`)

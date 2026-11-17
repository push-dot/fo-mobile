import { spacing } from '@push/design-system'
export { PM8, pm8SecondaryFill } from '@/shared/components/pm8'

/** `.pm-row` is 50 high with a 12 gap; the marked `.pm-row.cr` of an option board is 52 high with a 14 gap. */
export const pm8Row = (marked: boolean) => (marked ? { minHeight: 52, gap: 14 } : { minHeight: 50, gap: spacing[3] })

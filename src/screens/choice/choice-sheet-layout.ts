import { spacing } from '@push/design-system'
export { PM8, pm8SecondaryFill } from '@/shared/components/pm8'

export const pm8Row = (marked: boolean) => (marked ? { minHeight: 52, gap: 14 } : { minHeight: 50, gap: spacing[3] })

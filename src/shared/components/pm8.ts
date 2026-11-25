import { spacing } from '@push/design-system'
import { iosSheetButtonFill } from '@/theme/tokens'

export const PM8 = { gap: spacing[1], topGap: 0, actionGap: 10, buttonsTop: 10, bottomExtra: 12 } as const

export const pm8SecondaryFill = (ios: boolean, dark: boolean) => (ios && !dark ? iosSheetButtonFill : undefined)

export const PM8_SLIM_ACTION = { minHeight: 52, borderRadius: 26 } as const

export const PM8_MDET_TITLE = { fontSize: 22, lineHeight: 30, weight: '700' } as const

export const PM8_MDET_HEAD = { minHeight: 52, paddingTop: spacing[1], paddingBottom: spacing[2] } as const

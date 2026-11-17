import { spacing } from '@push/design-system'
import { iosSheetButtonFill } from '@/theme/tokens'

/** `.isheet.pm8` as measured on the boards: the title sits 17 under the sheet top, the first block 14 under the title, and the last button 38 above the sheet bottom. */
export const PM8 = { gap: spacing[1], topGap: 0, actionGap: 10, buttonsTop: 10, bottomExtra: 12 } as const

/** The secondary button fill of an iOS light sheet; other modes keep the plain fill. */
export const pm8SecondaryFill = (ios: boolean, dark: boolean) => (ios && !dark ? iosSheetButtonFill : undefined)

/** `.pm-row` is 50 high with a 12 gap; the marked `.pm-row.cr` of an option board is 52 high with a 14 gap. */
export const pm8Row = (marked: boolean) => (marked ? { minHeight: 52, gap: 14 } : { minHeight: 50, gap: spacing[3] })

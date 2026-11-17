import { spacing } from '@push/design-system'
import { iosSheetButtonFill } from '@/theme/tokens'

/** `.isheet.pm8` as measured on the boards: the title sits 17 under the sheet top, the first block 14 under the title, and the last button 38 above the sheet bottom. */
export const PM8 = { gap: spacing[1], topGap: 0, actionGap: 10, buttonsTop: 10, bottomExtra: 12 } as const

/** The secondary button fill of an iOS light sheet; other modes keep the plain fill. */
export const pm8SecondaryFill = (ios: boolean, dark: boolean) => (ios && !dark ? iosSheetButtonFill : undefined)

/** `.pm8 .pm-f .btn`: 52 high, fully rounded. */
export const PM8_SLIM_ACTION = { minHeight: 52, borderRadius: 26 } as const

/** `.pm8.mdet .pm-h .nt`: the large left title of the material sheets, 22/30 weight 700. */
export const PM8_MDET_TITLE = { fontSize: 22, lineHeight: 30, weight: '700' } as const

/** `.pm8.mdet .pm-h`: the title row, 52 high with padding 4/8. */
export const PM8_MDET_HEAD = { minHeight: 52, paddingTop: spacing[1], paddingBottom: spacing[2] } as const

import { spacing } from '../../../theme/tokens'

export const headerInset = (ios: boolean, nav: boolean) => (nav ? (ios ? 12 : 8) : spacing[5])

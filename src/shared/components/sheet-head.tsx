import { PlatformColor } from 'react-native'
import { spacing } from '../../theme'
import Text from './text'

/** iOS filter sheet group title (.ihead): 13 regular secondary label, 14 above, 6 below, 16 in from the chips. */
const SheetHead = ({ children }: { children: string }) => (
  <Text v="c1" style={{ color: PlatformColor('secondaryLabel'), paddingTop: 14, paddingBottom: 6, paddingLeft: spacing[4] }}>
    {children}
  </Text>
)

export default SheetHead

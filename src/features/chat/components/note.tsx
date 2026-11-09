import type { TextStyle } from 'react-native'
import { Text } from '@/shared/components'
import { spacing } from '../../../theme'

const Note = ({ children, style }: { children: string; style?: TextStyle }) => (
  <Text v="c2" color="t3" style={[{ paddingHorizontal: spacing[6], paddingTop: spacing[4], lineHeight: 17 }, style]}>
    {children}
  </Text>
)

export default Note

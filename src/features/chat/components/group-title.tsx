import type { TextStyle } from 'react-native'
import { Text } from '@/shared/components'
import { spacing } from '../../../theme'

const GroupTitle = ({ children, count, style }: { children: string; count?: number; style?: TextStyle }) => (
  <Text v="c1" weight="700" color="t3" style={[{ paddingTop: spacing[5], paddingBottom: spacing[1] }, style]}>
    {children}
    {count !== undefined ? <Text v="c1" weight="700" color="t4">{` ${count}`}</Text> : null}
  </Text>
)

export default GroupTitle

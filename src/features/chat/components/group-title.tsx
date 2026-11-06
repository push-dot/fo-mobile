import { Text } from '@/shared/components'
import { spacing } from '../../../theme'

const GroupTitle = ({ children, count }: { children: string; count?: number }) => (
  <Text v="c1" weight="700" color="t3" style={{ paddingTop: spacing[5], paddingBottom: spacing[1] }}>
    {children}
    {count !== undefined ? <Text v="c1" weight="700" color="t4">{` ${count}`}</Text> : null}
  </Text>
)

export default GroupTitle

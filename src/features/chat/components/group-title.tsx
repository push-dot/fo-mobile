import { Text } from '@/shared/components'

const GroupTitle = ({ children, count }: { children: string; count?: number }) => (
  <Text v="c1" weight="700" color="t3" style={{ paddingTop: 18, paddingBottom: 2 }}>
    {children}
    {count !== undefined ? <Text v="c1" weight="700" color="t4">{` ${count}`}</Text> : null}
  </Text>
)

export default GroupTitle

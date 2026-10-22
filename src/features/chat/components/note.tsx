import { Text } from '@/shared/components'

const Note = ({ children }: { children: string }) => (
  <Text v="c2" color="t3" style={{ paddingHorizontal: 24, paddingTop: 14, lineHeight: 17 }}>
    {children}
  </Text>
)

export default Note

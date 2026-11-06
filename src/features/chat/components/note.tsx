import { Text } from '@/shared/components'
import { spacing } from '../../../theme'

const Note = ({ children }: { children: string }) => (
  <Text v="c2" color="t3" style={{ paddingHorizontal: spacing[6], paddingTop: spacing[4], lineHeight: 17 }}>
    {children}
  </Text>
)

export default Note

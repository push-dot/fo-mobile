import { type ReactNode } from 'react'
import { Text } from '@/shared/components'
import { spacing } from '../../../theme'

const FieldLabel = ({ children }: { children: ReactNode }) => {
  return (
    <Text v="c1" weight="700" color="t3" style={{ paddingLeft: spacing[1] }}>
      {children}
    </Text>
  )
}

export default FieldLabel

import { type ReactNode } from 'react'
import { Text } from '@/shared/components'

const FieldLabel = ({ children }: { children: ReactNode }) => {
  return (
    <Text v="c1" weight="700" color="t3" style={{ paddingLeft: 4 }}>
      {children}
    </Text>
  )
}

export default FieldLabel

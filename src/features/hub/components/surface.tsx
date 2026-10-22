import type { ReactNode } from 'react'
import { Platform, View, type ViewStyle } from 'react-native'
import { Glass } from '../../../shared/components'
import { useColors } from '../../../theme'

const Flat = ({ style, children }: { style: ViewStyle; children: ReactNode }) => {
  const c = useColors()
  return <View style={[{ backgroundColor: c.fill }, style]}>{children}</View>
}

const Surface = Platform.OS === 'ios' ? Glass : Flat

export default Surface

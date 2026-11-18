import { View } from 'react-native'

export const Dot = ({ color, size = 8, top = 8 }: { color: string; size?: number; top?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginTop: top }} />
)

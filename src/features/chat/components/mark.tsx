import { View } from 'react-native'
import { Text } from '@/shared/components'

const Mark = ({ text, color, size = 44, round }: { text: string; color: string; size?: number; round?: boolean }) => {
  return (
    <View
      style={{ width: size, height: size, borderRadius: round ? size / 2 : Math.round(size * 0.31), backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text weight={round ? '700' : '800'} style={{ color: '#FFFFFF', fontSize: round ? size * 0.32 : size * 0.38, lineHeight: size * 0.5 }}>
        {text}
      </Text>
    </View>
  )
}

export default Mark

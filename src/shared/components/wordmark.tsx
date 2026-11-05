import { useColors } from '../../theme'
import Text from './text'

const Wordmark = ({ size = 24 }: { size?: number }) => {
  const c = useColors()
  const lineHeight = Math.round((size * 7) / 6)
  return (
    <Text v="h1" style={{ fontSize: size, lineHeight }}>
      Push<Text v="h1" style={{ fontSize: size, lineHeight, color: c.ac }}>.</Text>
    </Text>
  )
}

export default Wordmark

import { useColors } from '../../theme'
import Text from './text'

const TRACK_EM = -0.04
const BOARD_DROP = 2.7
const BOARD_SIZE = 24

const Wordmark = ({ size = BOARD_SIZE }: { size?: number }) => {
  const c = useColors()
  const lineHeight = size === BOARD_SIZE ? 28 : Math.round((size * 7) / 6)
  const style = { fontSize: size, lineHeight, letterSpacing: size * TRACK_EM, top: size === BOARD_SIZE ? BOARD_DROP : 0 } as const
  return (
    <Text v="h1" style={{ ...style, position: 'relative' }}>
      Push<Text v="h1" style={{ fontSize: size, lineHeight, letterSpacing: size * TRACK_EM, color: c.ac }}>.</Text>
    </Text>
  )
}

export default Wordmark

import { useColors } from '../../theme'
import Text from './text'

// The boards draw the wordmark at 24/28 with -.04em tracking (the h1 token tracks -.03em), and WebKit sits its ink 2.7 pt lower than CoreText
// in a line box this much shorter than the font (Main: ink y80.7-100.3 on the board, 78.0-97.7 in the app).
const TRACK_EM = -0.04
const BOARD_DROP = 2.7
const BOARD_SIZE = 24

const Wordmark = ({ size = 24 }: { size?: number }) => {
  const c = useColors()
  const lineHeight = Math.round((size * 7) / 6)
  const style = { fontSize: size, lineHeight, letterSpacing: size * TRACK_EM, top: size === BOARD_SIZE ? BOARD_DROP : 0 } as const
  return (
    <Text v="h1" style={{ ...style, position: 'relative' }}>
      Push<Text v="h1" style={{ fontSize: size, lineHeight, letterSpacing: size * TRACK_EM, color: c.ac }}>.</Text>
    </Text>
  )
}

export default Wordmark

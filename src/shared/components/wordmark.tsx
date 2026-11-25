import { StyleSheet } from 'react-native-unistyles'
import Text from './text'

const TRACK_EM = -0.04
const BOARD_DROP = 2.7
const BOARD_SIZE = 24

const lineHeightOf = (size: number) => (size === BOARD_SIZE ? 28 : Math.round((size * 7) / 6))

const Wordmark = ({ size = BOARD_SIZE }: { size?: number }) => (
  <Text v="h1" style={styles.word(size)}>
    Push<Text v="h1" style={styles.dot(size)}>.</Text>
  </Text>
)

const styles = StyleSheet.create((theme) => ({
  word: (size: number) => ({ fontSize: size, lineHeight: lineHeightOf(size), letterSpacing: size * TRACK_EM, top: size === BOARD_SIZE ? BOARD_DROP : 0, position: 'relative' }),
  dot: (size: number) => ({ fontSize: size, lineHeight: lineHeightOf(size), letterSpacing: size * TRACK_EM, color: theme.colors.ac }),
}))

export default Wordmark

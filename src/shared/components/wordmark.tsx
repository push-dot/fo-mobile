import Text from './text'

const Wordmark = ({ size = 22 }: { size?: number }) => {
  return (
    <Text v="h1" style={{ fontSize: size, lineHeight: size * 1.3 }}>
      Push<Text v="h1" color="ac" style={{ fontSize: size, lineHeight: size * 1.3 }}>.</Text>
    </Text>
  )
}

export default Wordmark

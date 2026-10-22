import { Text } from '@/shared/components'

const Empty = ({ text }: { text: string }) => {
  return (
    <Text
      v="b2"
      color="t3"
      style={{ textAlign: 'center', paddingVertical: 48, paddingHorizontal: 20 }}
    >
      {text}
    </Text>
  )
}

export default Empty

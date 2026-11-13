import { type ComponentProps } from 'react'
import { Text } from '@/shared/components'

const Rich = ({ text, ...rest }: { text: string } & ComponentProps<typeof Text>) => {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <Text {...rest}>
      {parts.map((part, index) =>
        index % 2 ? (
          <Text key={index} {...rest} weight="700">
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  )
}

export default Rich

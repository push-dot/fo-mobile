import { Fragment, type ComponentProps } from 'react'
import { Text } from '@/shared/components'
import { keepPartsWhole } from '@/shared/utility/keep-words'
import { Marked } from '../header/highlight'

/** `markId` is the line's id: pass it to draw 채팅에서 찾기 matches. */
const Rich = ({ text, markId, ...rest }: { text: string; markId?: string } & ComponentProps<typeof Text>) => {
  const plain = text.split(/\*\*(.+?)\*\*/g)
  const parts = keepPartsWhole(plain)
  const show = (part: string) => (markId ? <Marked text={part} itemId={markId} /> : part)
  return (
    <Text accessibilityLabel={plain.join('')} {...rest}>
      {parts.map((part, index) =>
        index % 2 ? (
          <Text key={index} {...rest} weight="700">
            {show(part)}
          </Text>
        ) : (
          <Fragment key={index}>{show(part)}</Fragment>
        ),
      )}
    </Text>
  )
}

export default Rich

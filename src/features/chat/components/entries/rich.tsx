import { Fragment, type ComponentProps } from 'react'
import { Text } from '@/shared/components'
import { FindText, Marked } from '../header/highlight'

/** `markId` is the line's id: pass it to draw 채팅에서 찾기 matches. */
const Rich = ({ text, markId, ...rest }: { text: string; markId?: string } & ComponentProps<typeof Text>) => {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  const show = (part: string) => (markId ? <Marked text={part} itemId={markId} /> : part)
  const body = (
    <>
      {parts.map((part, index) =>
        index % 2 ? (
          <Text key={index} {...rest} weight="700">
            {show(part)}
          </Text>
        ) : (
          <Fragment key={index}>{show(part)}</Fragment>
        ),
      )}
    </>
  )
  return markId ? (
    <FindText itemId={markId} {...rest}>
      {body}
    </FindText>
  ) : (
    <Text {...rest}>{body}</Text>
  )
}

export default Rich

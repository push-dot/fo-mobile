import { router, type Href } from 'expo-router'
import { Fragment, type ComponentProps } from 'react'
import { Text } from '@/shared/components'
import { Marked } from '../header/highlight'

// **bold** and [label](/app/route): a link inside a bubble opens a screen of the app (ChatStates.4 "이동하기").
const PART = /(\*\*.+?\*\*|\[[^\]]+\]\(\/[^)\s]*\))/g
const LINK = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/

/** `markId` is the line's id: pass it to draw 채팅에서 찾기 matches. */
const Rich = ({ text, markId, ...rest }: { text: string; markId?: string } & ComponentProps<typeof Text>) => {
  const show = (part: string) => (markId ? <Marked text={part} itemId={markId} /> : part)
  return (
    <Text {...rest}>
      {text.split(PART).map((part, index) => {
        if (!(index % 2)) return <Fragment key={index}>{show(part)}</Fragment>
        const link = LINK.exec(part)
        if (link)
          return (
            <Text key={index} {...rest} color="ac" weight="600" accessibilityRole="link" onPress={() => router.push(link[2] as Href)}>
              {show(link[1]!)}
            </Text>
          )
        return (
          <Text key={index} {...rest} weight="700">
            {show(part.slice(2, -2))}
          </Text>
        )
      })}
    </Text>
  )
}

export default Rich

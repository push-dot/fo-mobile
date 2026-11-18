import { router, type Href } from 'expo-router'
import { Fragment, useContext, type ComponentProps } from 'react'
import { Text } from '@/shared/components'
import { keepPartsWhole } from '@/shared/utility/keep-words'
import { hitCount } from '../../utils/find'
import { FindHighlight, FindText, Marked } from '../header/highlight'

// **bold** and [label](/app/route): a link inside a bubble opens a screen of the app (ChatStates.4 "이동하기").
const PART = /(\*\*.+?\*\*|\[[^\]]+\]\(\/[^)\s]*\))/g
const LINK = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/

const shownOf = (tokens: string[]) => tokens.map((token, index) => (index % 2 ? (LINK.exec(token)?.[1] ?? token.slice(2, -2)) : token))

/** The text a line draws, without its **bold** and link syntax: what 채팅에서 찾기 searches. */
export const plainOf = (text: string) => shownOf(text.split(PART)).join('')

/**
 * `markId` is the line's id: pass it to draw 채팅에서 찾기 matches. A bubble of several lines passes `hitsBefore`, the hits the lines above it
 * hold, so only the line with the current hit draws it as current.
 */
const Rich = ({ text, markId, hitsBefore, ...rest }: { text: string; markId?: string; hitsBefore?: number } & ComponentProps<typeof Text>) => {
  const { query, currentId, currentHit } = useContext(FindHighlight)
  const tokens = text.split(PART)
  const shown = shownOf(tokens)
  const current =
    markId === undefined || hitsBefore === undefined || currentHit === undefined
      ? undefined
      : markId === currentId && currentHit >= hitsBefore && currentHit < hitsBefore + hitCount(shown.join(''), query)
  const parts = keepPartsWhole(shown)
  const show = (part: string) => (markId ? <Marked text={part} itemId={markId} current={current} /> : part)
  const body = (
    <>
      {tokens.map((token, index) => {
        const part = parts[index]!
        if (!(index % 2)) return <Fragment key={index}>{show(part)}</Fragment>
        const link = LINK.exec(token)
        if (link)
          return (
            <Text key={index} {...rest} color="ac" weight="600" accessibilityRole="link" onPress={() => router.push(link[2] as Href)}>
              {show(part)}
            </Text>
          )
        return (
          <Text key={index} {...rest} weight="700">
            {show(part)}
          </Text>
        )
      })}
    </>
  )
  const label = shown.join('')
  return markId ? (
    <FindText itemId={markId} current={current} accessibilityLabel={label} {...rest}>
      {body}
    </FindText>
  ) : (
    <Text accessibilityLabel={label} {...rest}>
      {body}
    </Text>
  )
}

export default Rich

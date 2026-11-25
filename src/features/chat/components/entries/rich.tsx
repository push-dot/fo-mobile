import { router, type Href } from 'expo-router'
import { Fragment, useContext, type ComponentProps } from 'react'
import { Text } from '@/shared/components'
import { keepPartsWhole } from '@/shared/utility/keep-words'
import { hitCount } from '../../utils/find'
import { FindHighlight } from '../header/find-highlight'
import FindText from '../header/find-text'
import Marked from '../header/marked'

const PART = /(\*\*.+?\*\*|\[[^\]]+\]\(\/[^)\s]*\))/g
const LINK = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/

const shownOf = (tokens: string[]) => tokens.map((token, index) => (index % 2 ? (LINK.exec(token)?.[1] ?? token.slice(2, -2)) : token))

export const plainOf = (text: string) => shownOf(text.split(PART)).join('')

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

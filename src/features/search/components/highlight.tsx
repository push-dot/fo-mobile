import { matchHangul } from '@push/shared'
import { Text as RNText } from 'react-native'
import { fontFor, useColors } from '../../../theme'
import type { Weight } from '../../../theme/tokens'
import { bolder } from '../utils/bolder'

/** `weight` = the surrounding line's weight; the match is drawn one face bolder. */
const Highlight = ({ text, q, weight = '400' }: { text: string; q: string; weight?: Weight }) => {
  const c = useColors()
  const m = matchHangul(text, q)
  if (!m) return <>{text}</>
  return (
    <>
      {text.slice(0, m.start)}
      <RNText style={[{ color: c.acText }, fontFor(bolder(weight))]}>{text.slice(m.start, m.end)}</RNText>
      {text.slice(m.end)}
    </>
  )
}

export default Highlight

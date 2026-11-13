import { matchHangul } from '@push/shared'
import { Text as RNText } from 'react-native'
import { fontFor, useColors } from '../../theme'
import type { Weight } from '../../theme/tokens'

/** CSS `bolder`, which the boards' <b> match uses: 400-500 → 700, 600+ → 800 (the heaviest face we bundle). */
const bolder = (w: Weight): Weight => (Number(w) >= 600 ? '800' : '700')

/** A search match: the same black as the line (rule 3: colour only on the main button and the selected state), one face bolder. `weight` = the surrounding line's weight. */
const Highlight = ({ text, q, weight = '400' }: { text: string; q: string; weight?: Weight }) => {
  const c = useColors()
  const m = q ? matchHangul(text, q) : null
  if (!m) return <>{text}</>
  return (
    <>
      {text.slice(0, m.start)}
      <RNText style={[{ color: c.t1 }, fontFor(bolder(weight))]}>{text.slice(m.start, m.end)}</RNText>
      {text.slice(m.end)}
    </>
  )
}

export default Highlight

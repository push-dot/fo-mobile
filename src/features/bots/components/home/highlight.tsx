import { matchHangul } from '@push/shared'
import { Text as RNText } from 'react-native'
import { fontFor, useColors } from '../../../../theme'

const Highlight = ({ text, q }: { text: string; q: string }) => {
  const c = useColors()
  const hit = q ? matchHangul(text, q) : null
  if (!hit) return <>{text}</>
  const mark = { color: c.ac, ...fontFor('700') }
  return (
    <>
      {text.slice(0, hit.start)}
      <RNText style={mark}>{text.slice(hit.start, hit.end)}</RNText>
      {text.slice(hit.end)}
    </>
  )
}

export default Highlight

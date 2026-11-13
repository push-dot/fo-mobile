import { matchHangul } from '@push/shared'
import { Text as RNText } from 'react-native'
import { fontFor } from '../../../../theme'

const Highlight = ({ text, q }: { text: string; q: string }) => {
  const hit = q ? matchHangul(text, q) : null
  if (!hit) return <>{text}</>
  const mark = fontFor('700')
  return (
    <>
      {text.slice(0, hit.start)}
      <RNText style={mark}>{text.slice(hit.start, hit.end)}</RNText>
      {text.slice(hit.end)}
    </>
  )
}

export default Highlight

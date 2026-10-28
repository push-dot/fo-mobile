import { matchHangul } from '@push/shared'
import { Text as RNText } from 'react-native'
import { fontFor, useColors } from '../../../theme'

const Highlight = ({ text, q }: { text: string; q: string }) => {
  const c = useColors()
  const m = matchHangul(text, q)
  if (!m) return <>{text}</>
  return (
    <>
      {text.slice(0, m.start)}
      <RNText style={[{ color: c.acText }, fontFor('700')]}>{text.slice(m.start, m.end)}</RNText>
      {text.slice(m.end)}
    </>
  )
}

export default Highlight

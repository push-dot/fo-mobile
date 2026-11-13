import { createContext, useContext } from 'react'
import { Text as RNText } from 'react-native'
import { onAccent, useColors } from '../../../../theme'
import { splitMarks } from '../../utils/find'

/** The find query and the line the current result sits in. Outside a find, the query is empty and lines draw plain. */
export const FindHighlight = createContext<{ query: string; currentId?: string }>({ query: '' })

export const Marked = ({ text, itemId }: { text: string; itemId: string }) => {
  const { query, currentId } = useContext(FindHighlight)
  const c = useColors()
  if (!query.trim()) return <>{text}</>
  const current = itemId === currentId
  return (
    <>
      {splitMarks(text, query).map((mark, i) =>
        mark.hit ? (
          <RNText key={i} style={{ backgroundColor: current ? c.ac : c.acSoft, color: current ? onAccent : undefined }}>
            {mark.text}
          </RNText>
        ) : (
          mark.text
        ),
      )}
    </>
  )
}

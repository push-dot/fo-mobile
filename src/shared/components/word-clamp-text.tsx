import { useState, type ComponentProps } from 'react'
import Text from './text'
import { clampByWords } from './word-clamp'

type Props = Omit<ComponentProps<typeof Text>, 'children' | 'numberOfLines' | 'onTextLayout'> & { children: string; numberOfLines: number }

const WORD_JOINER = /⁠/g

const Clamped = ({ text, max, style, ...rest }: Omit<Props, 'children' | 'numberOfLines'> & { text: string; max: number }) => {
  const [lines, setLines] = useState<string[] | null>(null)
  const [dropped, setDropped] = useState(0)
  const [settled, setSettled] = useState(false)
  return (
    <Text
      {...rest}
      accessibilityLabel={text}
      numberOfLines={settled ? max : undefined}
      // Unsettled passes lay the text out for measuring only.
      style={[style, settled ? null : { opacity: 0 }]}
      onTextLayout={(e) => {
        if (settled) return
        const laid = e.nativeEvent.lines
        if (!lines) {
          if (laid.length <= max) setSettled(true)
          else setLines(laid.map((l) => l.text.replace(WORD_JOINER, '')))
          return
        }
        const words = lines[max - 1].trimEnd().split(' ').length
        if (laid.length <= max || dropped >= words - 1) setSettled(true)
        else setDropped(dropped + 1)
      }}
    >
      {lines ? clampByWords(lines, max, dropped) : text}
    </Text>
  )
}

/** Text clamped to `numberOfLines` the way the boards do: the cut falls on a word and the ellipsis follows it. */
const WordClampText = ({ children, numberOfLines, ...rest }: Props) => <Clamped key={children} text={children} max={numberOfLines} {...rest} />

export default WordClampText

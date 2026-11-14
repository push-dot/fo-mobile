import { useState, type ComponentProps } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { clampLines } from '../utility'
import Text from './text'

type Props = Omit<ComponentProps<typeof Text>, 'children' | 'numberOfLines' | 'onTextLayout'> & {
  children: string
  lines: number
  /** `hang`: the dots sit after the last word, outside the centred line (the board's multi-line clamp). `inline`: one line, the dots follow the kept text, space included (`text-overflow`). */
  ellipsis: 'hang' | 'inline'
  /** Sets the width the text wraps at; the hidden measuring copy fills it. */
  wrapperStyle?: StyleProp<ViewStyle>
}

/** Text cut like the boards' `-webkit-line-clamp` / `text-overflow: ellipsis`: at a word, where native tail truncation cuts the last line by character. */
const WordClampText = ({ children: text, lines, ellipsis, wrapperStyle, style, ...rest }: Props) => {
  const [laid, setLaid] = useState<{ text: string; lines: string[] } | null>(null)
  const kept = laid?.text === text ? clampLines(laid.lines, lines) : null
  const last = kept?.at(-1)
  return (
    <View style={wrapperStyle} accessible={kept ? true : undefined} accessibilityLabel={kept ? text : undefined}>
      <Text
        {...rest}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[style, { position: 'absolute', left: 0, right: 0, opacity: 0 }]}
        onTextLayout={(e) => setLaid({ text, lines: e.nativeEvent.lines.map((line) => line.text) })}
      >
        {text}
      </Text>
      {kept && last !== undefined ? (
        ellipsis === 'inline' ? (
          <Text {...rest} numberOfLines={1} style={style}>
            {`${last}…`}
          </Text>
        ) : (
          <>
            {kept.slice(0, -1).map((line, i) => (
              <Text key={i} {...rest} style={style}>
                {line.trimEnd()}
              </Text>
            ))}
            <View style={{ flexDirection: 'row' }}>
              <Text {...rest} style={style}>
                {last.trimEnd()}
              </Text>
              <View style={{ width: 0 }}>
                <Text {...rest} numberOfLines={1} style={[style, { width: 48, textAlign: 'left' }]}>
                  …
                </Text>
              </View>
            </View>
          </>
        )
      ) : (
        <Text {...rest} numberOfLines={lines} style={style}>
          {text}
        </Text>
      )}
    </View>
  )
}

export default WordClampText

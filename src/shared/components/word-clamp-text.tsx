import { useState, type ComponentProps } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { type } from '../../theme'
import { clampLines, dotted, longestFit } from '../utility'
import Text from './text'

const SPACE_EM = 0.27

type Props = Omit<ComponentProps<typeof Text>, 'children' | 'numberOfLines' | 'onTextLayout'> & {
  children: string
  lines: number
  ellipsis: 'hang' | 'inline' | 'line'
  wrapperStyle?: StyleProp<ViewStyle>
}

const WordClampText = ({ children: text, lines, ellipsis, wrapperStyle, style, ...rest }: Props) => {
  const [laid, setLaid] = useState<{ text: string; lines: string[]; widest: number } | null>(null)
  const [fitted, setFitted] = useState<{ text: string; line: string } | null>(null)
  const kept = laid?.text === text ? clampLines(laid.lines, lines) : null
  const last = kept?.at(-1)
  const candidates = ellipsis === 'line' && last !== undefined ? dotted(last) : null
  const fontSize = StyleSheet.flatten(style)?.fontSize ?? type[rest.v ?? 'b2'].fontSize
  return (
    <View style={wrapperStyle} accessible={kept ? true : undefined} accessibilityLabel={kept ? text : undefined}>
      <Text
        {...rest}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[style, { position: 'absolute', left: 0, right: 0, opacity: 0 }]}
        onTextLayout={(e) => setLaid({ text, lines: e.nativeEvent.lines.map((line) => line.text), widest: Math.max(...e.nativeEvent.lines.map((line) => line.width)) })}
      >
        {text}
      </Text>
      {candidates && laid ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, width: 2000, opacity: 0 }}>
          <Text
            {...rest}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={style}
            onTextLayout={(e) => setFitted({ text, line: longestFit(candidates, e.nativeEvent.lines.map((line) => line.width), laid.widest + SPACE_EM * fontSize) })}
          >
            {candidates.join('\n')}
          </Text>
        </View>
      ) : null}
      {kept && last !== undefined ? (
        ellipsis === 'line' ? (
          <>
            {kept.slice(0, -1).map((line, i) => (
              <Text key={i} {...rest} style={style}>
                {line.trimEnd()}
              </Text>
            ))}
            <Text {...rest} numberOfLines={1} style={style}>
              {fitted?.text === text ? fitted.line : `${last.trimEnd()}…`}
            </Text>
          </>
        ) : ellipsis === 'inline' ? (
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

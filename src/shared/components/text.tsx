import { Text as RNText, type TextProps } from 'react-native'
import { fontFor, type, useColors, type Colors, type TypeName } from '../../theme'

type Props = TextProps & {
  v?: TypeName
  color?: keyof Colors
  weight?: '400' | '500' | '600' | '700' | '800'
}

const Text = ({ v = 'b2', color = 't1', weight, style, ...rest }: Props) => {
  const c = useColors()
  const t = type[v]
  return (
    <RNText
      {...rest}
      style={[
        { fontSize: t.fontSize, lineHeight: t.lineHeight, letterSpacing: t.letterSpacing, color: c[color] },
        fontFor(weight ?? (t.fontWeight as '400')),
        style,
      ]}
    />
  )
}

export default Text

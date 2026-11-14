import { Children, type ReactNode } from 'react'
import { View } from 'react-native'
import { radius, spacing, useColors } from '../../theme'
import Text from './text'

const SettingsGroup = ({ title, note, children }: { title?: string; note?: string; children: ReactNode }) => {
  const c = useColors()
  // toArray flattens a mapped list (NOTIFICATION_ROWS.map) so every row gets its own separator, and drops null/false rows
  const rows = Children.toArray(children)
  return (
    <View>
      {title ? (
        <Text v="c1" weight="700" color="t3" style={{ paddingHorizontal: spacing[1], paddingBottom: spacing[2] }}>
          {title}
        </Text>
      ) : null}
      <View style={{ borderRadius: radius.card, backgroundColor: c.bg2, paddingHorizontal: spacing[4] }}>
        {rows.map((row, i) => (
          <View key={i} style={i > 0 ? { borderTopWidth: 1, borderTopColor: c.line } : undefined}>
            {row}
          </View>
        ))}
      </View>
      {note ? (
        <Text v="c2" color="t3" style={{ paddingHorizontal: spacing[1], paddingTop: spacing[2], lineHeight: 17 }}>
          {note}
        </Text>
      ) : null}
    </View>
  )
}

export default SettingsGroup

import { Children, type ReactNode } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Text from './text'

const SettingsGroup = ({ title, note, children }: { title?: string; note?: string; children: ReactNode }) => {
  const rows = Children.toArray(children)
  return (
    <View>
      {title ? (
        <Text v="c1" weight="700" color="t3" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={i} style={i > 0 ? styles.divided : undefined}>
            {row}
          </View>
        ))}
      </View>
      {note ? (
        <Text v="c2" color="t3" style={styles.note}>
          {note}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  title: { paddingHorizontal: theme.spacing[1], paddingBottom: theme.spacing[2] },
  card: { borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2, paddingHorizontal: theme.spacing[4] },
  divided: { borderTopWidth: 1, borderTopColor: theme.colors.line },
  note: { paddingHorizontal: theme.spacing[1], paddingTop: theme.spacing[2], lineHeight: 17 },
}))

export default SettingsGroup

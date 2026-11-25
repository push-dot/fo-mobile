import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Text from './text'

type BadgeTone = 'ac' | 'grey' | 'red' | 'green' | 'orange'

type BadgeGlyph = { char: string; gap: number }

const Badge = ({ label, minWidth, glyph }: { label: string; tone?: BadgeTone; minWidth?: number; glyph?: BadgeGlyph }) => {
  const passed = label === '합격' || label === '수락함'
  return (
    <View style={[styles.badge(minWidth), passed && styles.badgePassed]}>
      <View style={styles.row}>
        {glyph ? (
          <Text v="c2" weight="800" style={[styles.ink, passed && styles.inkPassed, styles.glyph(glyph.gap)]}>
            {glyph.char}
          </Text>
        ) : null}
        <Text v="c2" weight="700" style={[styles.ink, passed && styles.inkPassed]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  badge: (minWidth: number | undefined) => ({ minWidth, minHeight: 22, paddingHorizontal: 7, borderRadius: theme.radius.xs, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }),
  badgePassed: { backgroundColor: theme.colors.t1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ink: { color: theme.colors.t2 },
  inkPassed: { color: theme.colors.bg },
  glyph: (marginRight: number) => ({ marginRight }),
}))

export type { BadgeTone, BadgeGlyph }

export default Badge

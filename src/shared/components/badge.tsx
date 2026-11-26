import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Text from './text'

type BadgeGlyph = { char: string; gap: number }

const Badge = ({ label, solid, minWidth, glyph }: { label: string; solid?: boolean; minWidth?: number; glyph?: BadgeGlyph }) => {
  return (
    <View style={[styles.badge(minWidth), solid && styles.badgeSolid]}>
      <View style={styles.row}>
        {glyph ? (
          <Text v="c2" weight="800" style={[styles.ink, solid && styles.inkSolid, styles.glyph(glyph.gap)]}>
            {glyph.char}
          </Text>
        ) : null}
        <Text v="c2" weight="700" style={[styles.ink, solid && styles.inkSolid]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  badge: (minWidth: number | undefined) => ({ minWidth, minHeight: 22, paddingHorizontal: 7, borderRadius: theme.radius.xs, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }),
  badgeSolid: { backgroundColor: theme.colors.t1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  ink: { color: theme.colors.t2 },
  inkSolid: { color: theme.colors.bg },
  glyph: (marginRight: number) => ({ marginRight }),
}))

export type { BadgeGlyph }

export default Badge

import { ScrollView } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { GlassPressable, Icon3D, Text } from '@/shared/components'
import { quickStartsFor } from '../utils/quick-start-chips'
import { quickStartMarginBottom, quickStartShadowRoom } from '../utils/composer-geometry'

const QuickStartRow = ({ kind, onChip }: { kind: 'push' | 'company'; onChip: (key: string) => void }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="빠른 시작"
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {quickStartsFor(kind).map((item) => (
        <GlassPressable
          key={item.label}
          accessibilityRole="button"
          onPress={() => onChip(item.key)}
          fill="bg2"
          style={styles.chip}
          contentStyle={styles.chipContent}
        >
          <Icon3D name={item.icon} size={30} />
          <Text v="b2" weight="600" numberOfLines={1}>
            {item.label}
          </Text>
        </GlassPressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexGrow: 0, marginHorizontal: -theme.spacing[3], marginBottom: quickStartMarginBottom },
  content: { gap: theme.spacing[2], paddingHorizontal: theme.spacing[4], paddingVertical: quickStartShadowRoom },
  chip: { height: 52, borderRadius: theme.radius.pill },
  chipContent: { paddingLeft: theme.spacing[3], paddingRight: theme.spacing[5], gap: theme.spacing[2] },
}))

export default QuickStartRow

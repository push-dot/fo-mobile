import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { GlassPressable, Icon, Text } from '@/shared/components'
import { useColors } from '../../../../theme'

export const NewMessagesPill = ({ count, onPress }: { count: number; onPress: () => void }) => {
  const c = useColors()
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <GlassPressable
        accessibilityRole="button"
        onPress={onPress}
        fill="glass"
        style={styles.pill}
        contentStyle={styles.content}
      >
        <Icon name="down" size={18} color={c.t1} />
        <Text v="c1" weight="600" color="t1" style={styles.label}>
          {`새 메시지 ${count}개`}
        </Text>
      </GlassPressable>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: theme.spacing[3], alignItems: 'center', zIndex: 4 },
  pill: { height: 40, paddingHorizontal: theme.spacing[4], borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.line },
  content: { gap: 6 },
  label: { fontSize: 14 },
}))

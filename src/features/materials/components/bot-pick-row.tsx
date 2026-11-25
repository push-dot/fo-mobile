import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Bot } from '@/features/bots'
import { Icon, Mascot, Text } from '@/shared/components'

const BotPickRow = ({ bot, onPress }: { bot: Bot; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={bot.name}
    onPress={onPress}
    style={styles.row}
  >
    <Mascot size={40} state="idle" color={bot.kind === 'push' ? 'push' : bot.color} />
    <Text v="b1" weight="700" numberOfLines={1} style={styles.name}>
      {bot.name}
    </Text>
    <Icon name="chev" size={18} color="t3" />
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: 10, paddingHorizontal: theme.spacing[2], borderRadius: theme.radius.md },
  name: { flex: 1, minWidth: 0 },
}))

export default BotPickRow

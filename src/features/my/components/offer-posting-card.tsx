import { router } from 'expo-router'
import { Platform, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { OfferPosting } from '@push/api-client'
import { Icon, Text } from '@/shared/components'

const OfferPostingCard = ({ posting }: { posting: OfferPosting }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`함께 보낸 공고 ${posting.company} ${posting.title}`}
    onPress={() => router.push(`/postings/${posting.id}`)}
  >
    <View style={styles.card}>
      <View style={styles.body}>
        <Text v="c1" weight="600" color="t3">
          함께 보낸 공고
        </Text>
        <Text v="b2" weight="700" numberOfLines={1}>
          {posting.title}
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {posting.company}
        </Text>
      </View>
      <Icon name="chev" size={18} color="t3" />
    </View>
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    backgroundColor: Platform.OS === 'ios' ? theme.colors.bg2 : theme.colors.bg,
    borderWidth: Platform.OS === 'ios' ? 0 : 1,
    borderColor: theme.colors.line,
  },
  body: { flex: 1, minWidth: 0 },
}))

export default OfferPostingCard

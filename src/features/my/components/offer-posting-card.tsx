import { router } from 'expo-router'
import { Platform, Pressable, View } from 'react-native'
import type { OfferPosting } from '@push/api-client'
import { careerLabel } from '@push/shared'
import { Icon, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { usePostingDetail } from '../api/hooks'
import { dday } from '../utils'
import Logo from './logo'

const OfferPostingCard = ({ posting, compact }: { posting: OfferPosting; compact?: boolean }) => {
  const c = useColors()
  const { data: full } = usePostingDetail(posting.id)
  const career = full ? careerLabel(full) : null
  const careerText = !career || career === '신입' ? career : `경력 ${career}`
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`함께 보낸 공고 ${posting.company} ${posting.title}`}
      onPress={() => router.push(`/postings/${posting.id}`)}
    >
      <View
        style={{
          borderRadius: radius.card,
          paddingVertical: compact ? spacing[3] : spacing[4],
          paddingHorizontal: spacing[4],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          backgroundColor: Platform.OS === 'ios' ? c.bg2 : c.bg,
          borderWidth: Platform.OS === 'ios' ? 0 : 1,
          borderColor: c.line,
        }}
      >
        <Logo name={posting.company} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text v="c1" weight="600" color="t3">
            함께 보낸 공고
          </Text>
          <Text v="b2" weight="700" numberOfLines={1}>
            {posting.title}
          </Text>
          <Text v="c1" color="t3" numberOfLines={1}>
            {[full?.location, careerText, full?.deadline ? dday(full.deadline) : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Icon name="chev" size={18} color="t3" />
      </View>
    </Pressable>
  )
}

export default OfferPostingCard

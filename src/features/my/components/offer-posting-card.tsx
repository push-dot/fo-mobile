import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { OfferPosting } from '@push/api-client'
import { careerLabel } from '@push/shared'
import { Glass, Icon, Text } from '@/shared/components'
import { usePostingDetail } from '../api/hooks'
import { dday } from '../utils'
import Logo from './logo'

const OfferPostingCard = ({ posting }: { posting: OfferPosting }) => {
  const { data: full } = usePostingDetail(posting.id)
  const career = full ? careerLabel(full) : null
  const careerText = !career || career === '신입' ? career : `경력 ${career}`
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`함께 보낸 공고 ${posting.company} ${posting.title}`}
      onPress={() => router.push(`/postings/${posting.id}`)}
    >
      <Glass
        style={{
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
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
        <Icon name="chev" size={18} color="t4" />
      </Glass>
    </Pressable>
  )
}

export default OfferPostingCard

import { router } from 'expo-router'
import { memo } from 'react'
import { Pressable, View } from 'react-native'
import type { Profile } from '@push/api-client'
import { Avatar, careerLine } from '@/features/hub'
import { Icon, Text } from '../../../shared/components'
import Highlight from './highlight'
import { spacing } from '../../../theme'

const PersonRow = ({ p, q, onOpen }: { p: Profile; q: string; onOpen: () => void }) => {
  const career = careerLine(p)
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onOpen()
        router.push(`/profiles/${p.userId}`)
      }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing[5], paddingVertical: 14 }}
    >
      <Avatar name={p.displayName} url={p.avatarUrl} size={48} />
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <Text v="b1" weight="700" numberOfLines={1}>
          <Highlight text={p.displayName} q={q} weight="700" />
        </Text>
        <Text v="b2" color="t2" numberOfLines={1}>
          <Highlight text={p.headline} q={q} />
        </Text>
        {career ? (
          <Text v="c1" color="t3" numberOfLines={1}>
            {career}
          </Text>
        ) : null}
      </View>
      <Icon name="chev" size={18} color="t4" />
    </Pressable>
  )
}

export default memo(PersonRow)

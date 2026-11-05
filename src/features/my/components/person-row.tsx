import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import type { Profile } from '@push/api-client'
import { Text } from '@/shared/components'
import { onAccent, radius, spacing, useColors } from '../../../theme'
import { useFollowToggle } from '../api/hooks'
import Avatar from './avatar'
import Row from './row'


const PersonRow = ({ p, known }: { p: Profile; known: boolean | undefined }) => {
  const c = useColors()
  const [picked, setPicked] = useState<boolean>()
  const following = picked ?? known
  const toggle = useFollowToggle(p.userId, setPicked)
  return (
    <Row label={p.displayName} onPress={() => router.push(`/profiles/${p.userId}`)}>
      <Avatar name={p.displayName} url={p.avatarUrl} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="700">
          {p.displayName}
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {p.headline}
        </Text>
      </View>
      {following === undefined ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: following }}
          onPress={() => toggle.mutate(!following)}
          hitSlop={5}
          style={{
            height: 34,
            borderRadius: radius.chip,
            paddingHorizontal: spacing[4],
            justifyContent: 'center',
            backgroundColor: following ? c.fill : c.ac,
          }}
        >
          <Text v="c1" weight="700" style={{ color: following ? c.t1 : onAccent }}>
            {following ? '팔로잉' : '팔로우'}
          </Text>
        </Pressable>
      )}
    </Row>
  )
}

export default PersonRow

import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Profile } from '@push/api-client'
import { Text } from '@/shared/components'
import { onAccent } from '../../../theme'
import { useFollowToggle } from '../api/hooks'
import Avatar from './avatar'
import Row from './row'


const PersonRow = ({ p, known }: { p: Profile; known: boolean | undefined }) => {
  const [picked, setPicked] = useState<boolean>()
  const following = picked ?? known
  const toggle = useFollowToggle(p.userId, setPicked)
  return (
    <Row label={p.displayName} onPress={() => router.push(`/profiles/${p.userId}?from=following`)}>
      <Avatar name={p.displayName} url={p.avatarUrl} />
      <View style={styles.body}>
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
          style={[styles.follow, following && styles.followOn]}
        >
          <Text v="c1" weight="700" style={[styles.followLabel, following && styles.followLabelOn]}>
            {following ? '팔로잉' : '팔로우'}
          </Text>
        </Pressable>
      )}
    </Row>
  )
}

const styles = StyleSheet.create((theme) => ({
  body: { flex: 1, minWidth: 0 },
  follow: {
    height: 34,
    borderRadius: theme.radius.chip,
    paddingHorizontal: theme.spacing[4],
    justifyContent: 'center',
    backgroundColor: theme.colors.ac,
  },
  followOn: { backgroundColor: theme.colors.fill },
  followLabel: { fontSize: 14, color: onAccent },
  followLabelOn: { color: theme.colors.t1 },
}))

export default PersonRow

import { router, type Href } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { Profile } from '@push/api-client'
import { Badge, Icon, Text } from '../../../shared/components'
import { useColors } from '../../../theme'
import { STATUS_TONE } from '../constants'
import { careerLine, statusLabel } from '../utils'
import Avatar from './avatar'

const ProfileRow = ({ p }: { p: Profile }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/profiles/${p.userId}` as Href)}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: pressed ? c.fill : undefined })}
    >
      <Avatar userId={p.userId} name={p.displayName} url={p.avatarUrl} size={52} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
            {p.displayName}
          </Text>
          {p.careerStatus ? <Badge label={statusLabel(p.careerStatus)} tone={STATUS_TONE[p.careerStatus]} /> : null}
        </View>
        <Text v="b2" color="t2" numberOfLines={1}>
          {p.headline}
        </Text>
        <Text v="c1" color="t3">
          {careerLine(p)}
        </Text>
      </View>
      <View style={{ alignSelf: 'center' }}>
        <Icon name="chev" size={18} color="t4" />
      </View>
    </Pressable>
  )
}

export default ProfileRow

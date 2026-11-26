import { router, type Href } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { Profile } from '@push/api-client'
import { Badge, Icon, Text } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { prefetchProfile } from '../api/hooks'
import { careerLine, statusLabel } from '../utils'
import Avatar from './avatar'

const ProfileRow = ({ p }: { p: Profile }) => (
  <Pressable accessibilityRole="button" onPress={() => router.push(`/profiles/${p.userId}` as Href)} onPressIn={() => prefetchProfile(p.userId)} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
    <Avatar name={p.displayName} url={p.avatarUrl} size={52} />
    <View style={styles.body}>
      <View style={styles.nameRow}>
        <Text v="b1" weight="700" numberOfLines={1} style={styles.name}>
          {p.displayName}
        </Text>
        {p.careerStatus ? <Badge label={statusLabel(p.careerStatus)} /> : null}
      </View>
      <Text v="b2" color="t2" numberOfLines={1}>
        {p.headline}
      </Text>
      <Text v="c1" color="t3">
        {careerLine(p)}
      </Text>
    </View>
    <Icon name="chev" size={18} color="t1" />
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: theme.spacing[5], paddingVertical: 14 },
  rowPressed: { backgroundColor: theme.colors.fill },
  body: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  name: { flexShrink: 1 },
}))

export default ProfileRow

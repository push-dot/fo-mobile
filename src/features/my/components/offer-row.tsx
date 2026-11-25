import { router } from 'expo-router'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { Offer } from '@push/api-client'
import { Badge, Text, WordClampText } from '@/shared/components'
import { counterpart, OFFER_ARCHIVED_BADGE, offerBadge, personLine, timeAgo } from '../utils'
import Avatar from './avatar'
import Logo from './logo'
import Row from './row'

type Box = 'received' | 'sent'

const OfferRow = ({ o, box, archived }: { o: Offer; box: Box; archived?: boolean }) => {
  const who = counterpart(o, box)
  const unread = !archived && box === 'received' && !o.readAt
  const badge = archived
    ? { label: OFFER_ARCHIVED_BADGE, tone: 'grey' as const }
    : offerBadge(o, box)
  return (
    <Row
      top
      label={`${who.displayName}, ${badge.label}${unread ? ', 안 읽음' : ''}`}
      onPress={() =>
        router.push(`/offers/${o.id}${o.status === 'ACCEPTED' ? '/messages' : ''}?box=${box}`)
      }
    >
      {who.kind === 'COMPANY' ? (
        <Logo name={who.companyName ?? who.displayName} mono />
      ) : (
        <Avatar name={who.displayName} url={who.avatarUrl} />
      )}
      <View style={styles.body}>
        <View style={styles.head}>
          <Text v="b1" weight="700" numberOfLines={1} style={styles.name}>
            {who.displayName}
          </Text>
          <Badge label={badge.label} tone={badge.tone} />
          <Text v="c2" color="t3" style={styles.time}>
            {timeAgo(o.createdAt)}
          </Text>
        </View>
        {personLine(who) ? (
          <Text v="c1" color="t3" numberOfLines={1}>
            {personLine(who)}
          </Text>
        ) : null}
        <WordClampText ellipsis="line" v="b2" weight={unread ? '600' : '400'} color={unread ? 't1' : 't2'} lines={2}>
          {o.message}
        </WordClampText>
      </View>
      {unread ? (
        <View style={styles.dot} />
      ) : null}
    </Row>
  )
}

const styles = StyleSheet.create((theme) => ({
  body: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  name: { flexShrink: 1 },
  time: { marginLeft: 'auto' },
  dot: { width: 8, height: 8, borderRadius: theme.radius.pill, backgroundColor: theme.colors.ac },
}))

export default OfferRow

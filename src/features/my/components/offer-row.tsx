import { router } from 'expo-router'
import { View } from 'react-native'
import type { Offer } from '@push/api-client'
import { Badge, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../theme'
import { counterpart, OFFER_ARCHIVED_BADGE, offerBadge, personLine, timeAgo } from '../utils'
import Avatar from './avatar'
import Logo from './logo'
import Row from './row'

type Box = 'received' | 'sent'

/** `archived`: the 보관한 제안 list, where every row is a grey 보관함 and reads as already seen. */
const OfferRow = ({ o, box, archived }: { o: Offer; box: Box; archived?: boolean }) => {
  const c = useColors()
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
        <Logo name={who.companyName ?? who.displayName} />
      ) : (
        <Avatar name={who.displayName} url={who.avatarUrl} />
      )}
      <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
            {who.displayName}
          </Text>
          <Badge label={badge.label} tone={badge.tone} />
          <Text v="c2" color="t3" style={{ marginLeft: 'auto' }}>
            {timeAgo(o.createdAt)}
          </Text>
        </View>
        {personLine(who) ? (
          <Text v="c1" color="t3" numberOfLines={1}>
            {personLine(who)}
          </Text>
        ) : null}
        <Text v="b2" weight={unread ? '600' : '400'} color={unread ? 't1' : 't2'} numberOfLines={2}>
          {o.message}
        </Text>
      </View>
      {unread ? (
        <View style={{ width: 8, height: 8, borderRadius: radius.pill, backgroundColor: c.ac }} />
      ) : null}
    </Row>
  )
}

export default OfferRow

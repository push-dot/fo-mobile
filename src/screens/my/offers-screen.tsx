import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import type { Offer } from '@push/api-client'
import { Avatar, counterpart, Empty, Logo, OFFER_EMPTY_ACTION, offerBadge, personLine, Row, timeAgo, useOffers } from '@/features/my'
import { Badge, SegmentedControl, SkeletonRows, Text, TopBar } from '@/shared/components'
import type { SkeletonRowsShape } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'

const OFFER_SKELETON: SkeletonRowsShape = {
  count: 5,
  lead: { size: 48, radius: radius.pill },
  lines: [
    { width: '40%', height: 16 },
    { width: '90%', height: 14 },
  ],
}

type Box = 'received' | 'sent'

const OfferRow = ({ o, box }: { o: Offer; box: Box }) => {
  const c = useColors()
  const who = counterpart(o, box)
  const unread = box === 'received' && !o.readAt
  const badge = offerBadge(o, box)
  return (
    <Row
      top
      label={`${who.displayName}, ${badge.label}${unread ? ', 안 읽음' : ''}`}
      onPress={() => router.push(`/offers/${o.id}${o.status === 'ACCEPTED' ? '/messages' : ''}?box=${box}`)}
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
      {unread ? <View style={{ width: 8, height: 8, borderRadius: radius.pill, backgroundColor: c.ac }} /> : null}
    </Row>
  )
}

// The board ends the list and lifts its empty state by the same 40pt.
const LIST_END = 40

const OffersScreen = () => {
  const c = useColors()
  const [box, setBox] = useState<Box>('received')
  const received = useOffers('received')
  const sent = useOffers('sent')
  const q = box === 'received' ? received : sent
  const n = (r: typeof received) => r.data?.page.total ?? r.data?.data.length ?? 0

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={box === 'received' ? '받은 제안' : '제안함'} onBack={() => router.back()} />
      <View style={{ paddingTop: spacing[1], paddingBottom: spacing[2], paddingHorizontal: spacing[5] }}>
        <SegmentedControl
          items={[
            { key: 'received', label: `받은 제안 ${n(received)}` },
            { key: 'sent', label: `보낸 제안 ${n(sent)}` },
          ]}
          value={box}
          onChange={setBox}
        />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {q.isLoading ? <SkeletonRows {...OFFER_SKELETON} /> : null}
        {q.data?.data.length === 0 ? (
          <Empty
            text={box === 'received' ? '아직 받은 제안이 없어요.' : '아직 보낸 제안이 없어요.'}
            lift={LIST_END}
            action={box === 'received' ? OFFER_EMPTY_ACTION : undefined}
            onAction={box === 'received' ? () => router.push('/edit-profile/basic') : undefined}
          />
        ) : null}
        {q.data?.data.map((o) => (
          <OfferRow key={o.id} o={o} box={box} />
        ))}
        {q.data?.data.length ? (
          <Text v="c2" color="t3" style={{ paddingTop: spacing[5], paddingBottom: LIST_END, paddingHorizontal: spacing[6] }}>
            {box === 'received'
              ? '허브 프로필이 공개돼 있어야 제안을 받을 수 있어요.'
              : '상대가 읽으면 ‘읽음’으로 바뀌고, 수락하면 대화를 시작할 수 있어요.'}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  )
}

export default OffersScreen

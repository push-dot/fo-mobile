import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import type { Offer } from '@push/api-client'
import { Avatar, counterpart, Empty, offerBadge, Row, timeAgo, useOffers } from '@/features/my'
import { Badge, SegmentedControl, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

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
      onPress={() => router.push(`/offers/${o.id}?box=${box}`)}
    >
      <Avatar name={who.displayName} url={who.avatarUrl} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
            {who.displayName}
          </Text>
          <Badge label={badge.label} tone={badge.tone} />
          <Text v="c2" color="t3" style={{ marginLeft: 'auto' }}>
            {timeAgo(o.createdAt)}
          </Text>
        </View>
        {who.companyName ? (
          <Text v="c1" color="t3" numberOfLines={1}>
            {who.companyName}
          </Text>
        ) : null}
        <Text v="b2" weight={unread ? '600' : '400'} color={unread ? 't1' : 't2'} numberOfLines={2}>
          {o.message}
        </Text>
      </View>
      {unread ? (
        <View
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.ac, marginTop: 8 }}
        />
      ) : null}
    </Row>
  )
}

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
      <View style={{ paddingTop: 4, paddingBottom: 6, paddingHorizontal: 20 }}>
        <SegmentedControl
          items={[
            { key: 'received', label: `받은 제안 ${n(received)}` },
            { key: 'sent', label: `보낸 제안 ${n(sent)}` },
          ]}
          value={box}
          onChange={setBox}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {q.isLoading ? <ActivityIndicator style={{ marginTop: 40 }} /> : null}
        {q.data?.data.length === 0 ? (
          <Empty
            text={box === 'received' ? '아직 받은 제안이 없어요.' : '아직 보낸 제안이 없어요.'}
          />
        ) : null}
        {q.data?.data.map((o) => (
          <OfferRow key={o.id} o={o} box={box} />
        ))}
        <Text v="c2" color="t3" style={{ paddingTop: 18, paddingHorizontal: 24, lineHeight: 17 }}>
          {box === 'received'
            ? '허브 프로필이 공개돼 있어야 제안을 받을 수 있어요.'
            : '상대가 읽으면 ‘읽음’으로 바뀌고, 수락하면 대화를 시작할 수 있어요.'}
        </Text>
      </ScrollView>
    </View>
  )
}

export default OffersScreen

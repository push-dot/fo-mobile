import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Empty, OFFER_ARCHIVED_ROW, OFFER_EMPTY_ACTION, OfferRow, Row, useArchivedOffers, useOffers } from '@/features/my'
import { Icon, SegmentedControl, SkeletonRows, Text, TopBar } from '@/shared/components'
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

const ArchivedRow = ({ count }: { count: number }) => {
  const c = useColors()
  return (
    <View style={{ marginTop: spacing[1] }}>
      <Row label={`${OFFER_ARCHIVED_ROW} ${count}개`} onPress={() => router.push('/offers/archived')}>
        <View style={{ width: 48, height: 48, borderRadius: radius.pill, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="archive" size={20} color="t2" />
        </View>
        <Text v="b1" weight="600" style={{ flex: 1 }}>
          {OFFER_ARCHIVED_ROW}
        </Text>
        <Text v="c1" color="t3">
          {count}개
        </Text>
        <Icon name="chev" size={18} color="t3" />
      </Row>
    </View>
  )
}

// The board ends the list and lifts its empty state by the same 40pt.
const LIST_END = 40

const OffersScreen = () => {
  const c = useColors()
  const [box, setBox] = useState<Box>('received')
  const received = useOffers('received')
  const sent = useOffers('sent')
  const archived = useArchivedOffers('received').data?.page.total ?? 0
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
        {box === 'received' && archived > 0 ? <ArchivedRow count={archived} /> : null}
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

import { router } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { useState, type ComponentProps } from 'react'
import { View } from 'react-native'
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
type OfferItem = ComponentProps<typeof OfferRow>['o']

const ArchivedRow = ({ count }: { count: number }) => (
  <View style={{ marginTop: spacing[1] }}>
    <Row label={`${OFFER_ARCHIVED_ROW} ${count}개`} onPress={() => router.push('/offers/archived')}>
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

const LIST_END = 40

const OffersScreen = () => {
  const c = useColors()
  const [box, setBox] = useState<Box>('received')
  const received = useOffers('received')
  const sent = useOffers('sent')
  const archived = useArchivedOffers('received').data?.page.total ?? 0
  const q = box === 'received' ? received : sent
  const renderItem = ({ item }: { item: OfferItem }) => <OfferRow o={item} box={box} />
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
      <LegendList
        data={q.data?.data ?? []}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        estimatedItemSize={84}
        extraData={box}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          q.isLoading ? (
            <SkeletonRows {...OFFER_SKELETON} />
          ) : q.data ? (
            <Empty
              text={box === 'received' ? '아직 받은 제안이 없어요.' : '아직 보낸 제안이 없어요.'}
              lift={LIST_END}
              action={box === 'received' ? OFFER_EMPTY_ACTION : undefined}
              onAction={box === 'received' ? () => router.push('/edit-profile/basic') : undefined}
            />
          ) : null
        }
        ListFooterComponent={
          <>
            {box === 'received' && archived > 0 ? <ArchivedRow count={archived} /> : null}
            {q.data?.data.length ? (
              <Text
                v="c2"
                color="t3"
                style={{ paddingTop: box === 'received' ? spacing[1] : spacing[5], paddingBottom: spacing[4], paddingHorizontal: box === 'received' ? spacing[5] : spacing[6], lineHeight: 17 }}
              >
                {box === 'received'
                  ? '허브 프로필이 공개돼 있어야 제안을 받을 수 있어요.'
                  : '상대가 읽으면 ‘읽음’으로 바뀌고, 수락하면 대화를 시작할 수 있어요.'}
              </Text>
            ) : null}
          </>
        }
      />
    </View>
  )
}

export default OffersScreen

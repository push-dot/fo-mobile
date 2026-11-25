import { router } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { useState, type ComponentProps } from 'react'
import { View } from 'react-native'
import { Empty, OFFER_ARCHIVED_ROW, OFFER_EMPTY_ACTION, OfferRow, Row, useArchivedOffers, useOffers } from '@/features/my'
import { Icon, SegmentedControl, SkeletonRows, Text, TopBar } from '@/shared/components'
import type { SkeletonRowsShape } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { radius } from '@/theme'

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
  <View style={styles.archived}>
    <Row label={`${OFFER_ARCHIVED_ROW} ${count}개`} onPress={() => router.push('/offers/archived')}>
      <Text v="b1" weight="600" style={styles.archivedLabel}>
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
  const [box, setBox] = useState<Box>('received')
  const received = useOffers('received')
  const sent = useOffers('sent')
  const archived = useArchivedOffers('received').data?.page.total ?? 0
  const q = box === 'received' ? received : sent
  const renderItem = ({ item }: { item: OfferItem }) => <OfferRow o={item} box={box} />
  const n = (r: typeof received) => r.data?.page.total ?? r.data?.data.length ?? 0

  return (
    <View style={styles.screen}>
      <TopBar title={box === 'received' ? '받은 제안' : '제안함'} onBack={() => router.back()} />
      <View style={styles.segment}>
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
        contentContainerStyle={styles.list}
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
                style={[styles.footnote, box === 'received' ? styles.footnoteReceived : styles.footnoteSent]}
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

const styles = StyleSheet.create((theme) => ({
  archived: { marginTop: theme.spacing[1] },
  archivedLabel: { flex: 1 },
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  segment: { paddingTop: theme.spacing[1], paddingBottom: theme.spacing[2], paddingHorizontal: theme.spacing[5] },
  list: { flexGrow: 1 },
  footnote: { paddingBottom: theme.spacing[4], lineHeight: 17 },
  footnoteReceived: { paddingTop: theme.spacing[1], paddingHorizontal: theme.spacing[5] },
  footnoteSent: { paddingTop: theme.spacing[5], paddingHorizontal: theme.spacing[6] },
}))

export default OffersScreen

import { router } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { View } from 'react-native'
import { OFFER_ARCHIVED_NOTE, OFFER_MENU_COPY, OfferRow, RETRY_LABEL, useArchivedOffers } from '@/features/my'
import { emptyNoteStyle, SkeletonRows, StatusNote, Text, TopBar } from '@/shared/components'
import type { SkeletonRowsShape } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'

const OFFER_SKELETON: SkeletonRowsShape = {
  count: 3,
  lead: { size: 48, radius: radius.pill },
  lines: [
    { width: '40%', height: 16 },
    { width: '90%', height: 14 },
  ],
}

const ArchivedOffersScreen = () => {
  const c = useColors()
  const q = useArchivedOffers('received')
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="보관한 제안" onBack={() => router.back()} />
      <LegendList
        data={q.data?.data ?? []}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OfferRow o={item} box="received" archived />}
        estimatedItemSize={84}
        ListHeaderComponent={
          <Text
            v="b2"
            color="t3"
            style={{
              paddingTop: spacing[1],
              paddingBottom: spacing[3],
              paddingHorizontal: spacing[6],
            }}
          >
            {OFFER_ARCHIVED_NOTE}
          </Text>
        }
        ListEmptyComponent={
          q.isLoading ? (
            <SkeletonRows {...OFFER_SKELETON} />
          ) : q.isError && !q.data ? (
            <StatusNote lines={[OFFER_MENU_COPY.failed]} action={{ label: RETRY_LABEL, onPress: () => void q.refetch() }} style={emptyNoteStyle(140)} />
          ) : null
        }
      />
    </View>
  )
}

export default ArchivedOffersScreen

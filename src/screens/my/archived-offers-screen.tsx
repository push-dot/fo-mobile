import { router } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { OFFER_ARCHIVED_NOTE, OFFER_MENU_COPY, OfferRow, RETRY_LABEL, useArchivedOffers } from '@/features/my'
import { emptyNoteStyle, SkeletonRows, StatusNote, Text, TopBar } from '@/shared/components'
import type { SkeletonRowsShape } from '@/shared/components'
import { radius } from '@/theme'

const OFFER_SKELETON: SkeletonRowsShape = {
  count: 3,
  lead: { size: 48, radius: radius.pill },
  lines: [
    { width: '40%', height: 16 },
    { width: '90%', height: 14 },
  ],
}

const ArchivedOffersScreen = () => {
  const q = useArchivedOffers('received')
  return (
    <View style={styles.screen}>
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
            style={styles.note}
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

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  note: { paddingTop: theme.spacing[1], paddingBottom: theme.spacing[3], paddingHorizontal: theme.spacing[6] },
}))

export default ArchivedOffersScreen

import { withDeadlineWindow } from '@push/api-client'
import { router } from 'expo-router'
import { View } from 'react-native'
import { PostingGrid, SECTIONS, type SectionKind } from '@/features/jobs'
import { ScreenBar, Text } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const SectionScreen = ({ kind }: { kind: SectionKind }) => {
  const c = useColors()
  const s = SECTIONS[kind]
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenBar bar={{ title: s.title, onBack: () => router.back() }}>
        {({ topInset, onScroll }) => (
          <PostingGrid
            filters={withDeadlineWindow({ sort: kind })}
            topInset={topInset}
            onScroll={onScroll}
            header={
              <Text v="b2" color="t3" style={{ paddingHorizontal: spacing[5], paddingTop: spacing[1], paddingBottom: spacing[4] }}>
                {s.description}
              </Text>
            }
          />
        )}
      </ScreenBar>
    </View>
  )
}

export default SectionScreen

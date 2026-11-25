import { withDeadlineWindow } from '@push/api-client'
import { router } from 'expo-router'
import { View } from 'react-native'
import { PostingGrid, SECTIONS, type SectionKind } from '@/features/jobs'
import { ScreenBar, Text } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'

const SectionScreen = ({ kind }: { kind: SectionKind }) => {
  const s = SECTIONS[kind]
  return (
    <View style={styles.screen}>
      <ScreenBar bar={{ title: s.title, onBack: () => router.back() }}>
        {({ topInset, onScroll }) => (
          <PostingGrid
            filters={withDeadlineWindow({ sort: kind })}
            topInset={topInset}
            onScroll={onScroll}
            header={
              <Text v="b2" color="t3" style={styles.description}>
                {s.description}
              </Text>
            }
          />
        )}
      </ScreenBar>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  description: { paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[1], paddingBottom: theme.spacing[4] },
}))

export default SectionScreen

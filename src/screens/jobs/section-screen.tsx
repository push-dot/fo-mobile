import { withDeadlineWindow } from '@push/api-client'
import { router } from 'expo-router'
import { View } from 'react-native'
import { PostingGrid, SECTIONS, type SectionKind } from '@/features/jobs'
import { Text, TopBar } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const SectionScreen = ({ kind }: { kind: SectionKind }) => {
  const c = useColors()
  const s = SECTIONS[kind]
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={s.title} onBack={() => router.back()} />
      <PostingGrid
        filters={withDeadlineWindow({ sort: kind })}
        header={
          <Text v="b2" color="t3" style={{ paddingHorizontal: spacing[5], paddingTop: spacing[1], paddingBottom: spacing[4] }}>
            {s.description}
          </Text>
        }
      />
    </View>
  )
}

export default SectionScreen

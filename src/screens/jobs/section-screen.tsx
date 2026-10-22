import { router } from 'expo-router'
import { View } from 'react-native'
import { PostingGrid, SECTIONS, type SectionKind } from '@/features/jobs'
import { Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

const SectionScreen = ({ kind }: { kind: SectionKind }) => {
  const c = useColors()
  const s = SECTIONS[kind]
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title={s.title} onBack={() => router.back()} />
      <PostingGrid
        filters={{ sort: kind }}
        header={
          <Text v="b2" color="t3" style={{ paddingHorizontal: 20, paddingTop: 2, paddingBottom: 16 }}>
            {s.description}
          </Text>
        }
      />
    </View>
  )
}

export default SectionScreen

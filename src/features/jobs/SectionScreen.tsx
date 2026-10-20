import { router } from 'expo-router'
import { View } from 'react-native'
import { useColors } from '../../theme'
import { Text, TopBar } from '../../ui'
import { PostingGrid } from './PostingGrid'

export type SectionKind = 'latest' | 'deadline' | 'popular'

// Home section titles; the descriptions for 새로 올라온/많이 본 are not on a board (guessed in the same voice).
export const SECTIONS: Record<SectionKind, { title: string; description: string }> = {
  latest: { title: '새로 올라온 공고', description: '최근에 올라온 공고부터 보여드려요' },
  deadline: { title: '마감 임박 공고', description: '일주일 안에 마감되는 공고예요' },
  popular: { title: '이번 주 많이 본 공고', description: '이번 주에 사람들이 많이 본 공고예요' },
}

/** 섹션 전체보기: the 채용공고 grid frame with the section's sort. */
export function SectionScreen({ kind }: { kind: SectionKind }) {
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

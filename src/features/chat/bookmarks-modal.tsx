import type { Posting } from '@push/api-client'
import { brandOf, careerLabel } from '@push/shared'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { BottomSheet, Button, Chip, Icon, Text } from '@/shared/components'
import { useChatBookmarks, useStartChat } from './api/hooks'
import { Mark, Note, PageModal } from './components'

// Same company colour as JobCard so a company looks the same across screens.
export const logoColor = brandOf

const soon = (p: Posting) => !!p.deadline && new Date(p.deadline).getTime() - Date.now() < 7 * 86_400_000

/** 북마크한 공고 modal (ChatBookmarks). Tapping a job offers its detail or a conversation tailored to it. */
export const BookmarksModal = ({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: () => void }) => {
  const start = useStartChat()
  const [filter, setFilter] = useState<'all' | 'soon' | 'notApplied'>('all')
  const [picked, setPicked] = useState<Posting | null>(null)
  const q = useChatBookmarks(visible)
  const all = q.data?.data ?? []
  const lists = { all, soon: all.filter(soon), notApplied: all.filter((p) => !p.applied) }
  const go = (fn: () => void) => (setPicked(null), onDone(), fn())

  return (
    <PageModal visible={visible} onClose={onClose} title="북마크한 공고">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 6 }}>
        <Chip label={`전체 ${lists.all.length}`} on={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={`마감 임박 ${lists.soon.length}`} on={filter === 'soon'} onPress={() => setFilter('soon')} />
        <Chip label={`지원 안 함 ${lists.notApplied.length}`} on={filter === 'notApplied'} onPress={() => setFilter('notApplied')} />
      </ScrollView>
      {lists[filter].map((p) => (
        <Pressable key={p.id} accessibilityRole="button" onPress={() => setPicked(p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 20 }}>
          <Mark text={p.company.slice(0, 1)} color={logoColor(p.company)} size={56} />
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text v="c1" weight="600" color="t3">
              {p.company}
            </Text>
            <Text v="b1" weight="700" numberOfLines={1}>
              {p.title}
            </Text>
            <Text v="c1" color="t3">
              {p.location} · {careerLabel(p)}
            </Text>
          </View>
          <Icon name="bookmark" size={22} color="acText" filled />
        </Pressable>
      ))}
      {q.data && lists[filter].length === 0 ? (
        <Text v="b2" color="t3" style={{ padding: 24, textAlign: 'center' }}>
          해당하는 공고가 없어요
        </Text>
      ) : null}
      <Note>공고를 누르면 상세를 보거나 그 공고에 맞춰 대화를 시작할 수 있어요.</Note>
      <BottomSheet visible={!!picked} onClose={() => setPicked(null)} title={picked ? `${picked.company} · ${picked.title}` : undefined}>
        {picked ? (
          <View style={{ gap: 8 }}>
            <Button
              label="이 공고에 맞춰 대화 시작"
              onPress={() => go(() => void start(`${picked.company} ${picked.title}`, `${picked.company} ${picked.title} 공고에 맞춰 내 이력서를 고쳐 주세요`))}
            />
            <Button label="공고 보기" variant="secondary" onPress={() => go(() => router.push(`/postings/${picked.id}`))} />
          </View>
        ) : null}
      </BottomSheet>
    </PageModal>
  )
}

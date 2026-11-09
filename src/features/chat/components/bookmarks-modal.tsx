import type { Posting } from '@push/api-client'
import { brandColor, careerLabel } from '@push/shared'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Button, Chip, Icon, Menu, Text } from '@/shared/components'
import { spacing } from '../../../theme'
import { useBookmarkList } from '@/features/my'
import { useStartChat } from '../api/hooks'
import { useLeaveSidebar } from '../hooks'
import { BOOKMARK_EMPTY } from '../constants'
import Mark from './mark'
import Note from './note'
import PageModal, { PageEmpty } from './page-modal'


const soon = (p: Posting) => !!p.deadline && new Date(p.deadline).getTime() - Date.now() < 7 * 86_400_000

/** 북마크한 공고 modal (ChatBookmarks). Tapping a job offers its detail or a conversation tailored to it. */
export const BookmarksModal = () => {
  const start = useStartChat()
  const leave = useLeaveSidebar()
  const [filter, setFilter] = useState<'all' | 'soon' | 'notApplied'>('all')
  const q = useBookmarkList(true)
  const all = q.data?.data ?? []
  const lists = { all, soon: all.filter(soon), notApplied: all.filter((p) => !p.applied) }
  const empty = !!q.data && all.length === 0

  return (
    <PageModal title="북마크한 공고">
      {empty ? (
        <PageEmpty>
          <Text v="b1" weight="700" color="t2">
            {BOOKMARK_EMPTY}
          </Text>
          <View style={{ marginTop: spacing[3] }}>
            <Button label="채용공고 보기" size="pill" variant="secondary" onPress={() => leave(() => router.push('/jobs'))} />
          </View>
        </PageEmpty>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[1], paddingBottom: spacing[2] }}>
            <Chip label={`전체 ${lists.all.length}`} on={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label={`마감 임박 ${lists.soon.length}`} on={filter === 'soon'} onPress={() => setFilter('soon')} />
            <Chip label={`지원 안 함 ${lists.notApplied.length}`} on={filter === 'notApplied'} onPress={() => setFilter('notApplied')} />
          </ScrollView>
          {lists[filter].map((p) => (
            <Menu
              key={p.id}
              stretch
              accessibilityLabel={`${p.company} ${p.title}`}
              actions={[
                {
                  key: 'chat',
                  label: '이 공고에 맞춰 대화 시작',
                  systemImage: 'bubble.left',
                  onPress: () => leave(() => void start(`${p.company} ${p.title}`, `${p.company} ${p.title} 공고에 맞춰 내 이력서를 고쳐 주세요`, undefined, undefined, 'match_posting')),
                },
                { key: 'open', label: '공고 보기', systemImage: 'doc.text', onPress: () => leave(() => router.push(`/postings/${p.id}`)) },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingVertical: spacing[3], paddingHorizontal: spacing[5] }}>
                <Mark text={p.company.slice(0, 1)} color={brandColor(p.company)} size={56} />
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
              </View>
            </Menu>
          ))}
          {q.data && lists[filter].length === 0 ? (
            <Text v="b2" color="t3" style={{ padding: spacing[6], textAlign: 'center' }}>
              해당하는 공고가 없어요
            </Text>
          ) : null}
          <Note>공고를 누르면 상세를 보거나 그 공고에 맞춰 대화를 시작할 수 있어요.</Note>
        </>
      )}
    </PageModal>
  )
}

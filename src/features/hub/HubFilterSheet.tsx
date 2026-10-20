import { useQuery } from '@tanstack/react-query'
import { CAREER_STATUSES, TENURES, type JobCategory } from '@push/api-client'
import { useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { api } from '../../lib/api'
import { BottomSheet, Chip, Text } from '../../ui'
import { EMPTY_SHEET, profileQuery, toggle, type SheetFilters } from './filters'

type Props = {
  visible: boolean
  onClose: () => void
  category: JobCategory[]
  value: SheetFilters
  onApply: (f: SheetFilters) => void
}

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={{ gap: 10 }}>
    <Text v="b2" weight="700">
      {title}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>{children}</View>
  </View>
)

// push-be's profiles page has no total yet, so the CTA falls back to "프로필 보기" in real mode.
const useTotal = (key: unknown[], query: Parameters<typeof api.profiles.list>[0], enabled: boolean) =>
  useQuery({ queryKey: ['profiles', 'count', ...key], queryFn: () => api.profiles.list({ ...query, limit: 1 }), enabled }).data?.page.total

/** 허브 · 필터 sheet. Edits a draft; "프로필 N개 보기" applies it with the live total. */
export function HubFilterSheet({ visible, onClose, category, value, onApply }: Props) {
  const [draft, setDraft] = useState(value)
  // Start each opening from the applied filters.
  const [opened, setOpened] = useState({ visible, value })
  if (opened.visible !== visible || opened.value !== value) {
    setOpened({ visible, value })
    if (visible) setDraft(value)
  }

  const total = useTotal([category, draft], profileQuery(category, draft), visible)
  const sent = useTotal(['offers'], { explore: 'offers' }, visible)

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      action={{ label: total === undefined ? '프로필 보기' : `프로필 ${total}개 보기`, onPress: () => onApply(draft) }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text v="h2" accessibilityRole="header">
          필터
        </Text>
        <Pressable accessibilityRole="button" onPress={() => setDraft(EMPTY_SHEET)} hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text v="c1" weight="700" color="ac">
            초기화
          </Text>
        </Pressable>
      </View>
      <Group title="재직 기간">
        {TENURES.map((t) => (
          <Chip key={t.key} label={t.label} check on={draft.tenure.includes(t.key)} onPress={() => setDraft({ ...draft, tenure: toggle(draft.tenure, t.key) })} />
        ))}
      </Group>
      <Group title="커리어 상태">
        {CAREER_STATUSES.map((s) => (
          <Chip key={s.key} label={s.label} check on={draft.status.includes(s.key)} onPress={() => setDraft({ ...draft, status: toggle(draft.status, s.key) })} />
        ))}
      </Group>
      <Group title="탐색">
        <Chip label="추천" check on={draft.explore === 'recommended'} onPress={() => setDraft({ ...draft, explore: 'recommended' })} />
        <Chip label="제안" check on={draft.explore === 'offers'} onPress={() => setDraft({ ...draft, explore: 'offers' })} />
        {sent !== undefined ? (
          <Text v="c1" color="t3">
            보낸 제안 {sent}
          </Text>
        ) : null}
      </Group>
    </BottomSheet>
  )
}

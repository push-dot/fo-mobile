import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { CAREER_STATUSES, TENURES, type JobCategory } from '@push/api-client'
import { BottomSheet, Chip, Text } from '../../../shared/components'
import { useProfileCount } from '../api/hooks'
import { EMPTY_SHEET, profileQuery, toggle, type SheetFilters } from '../utils'
import HubFilterGroup from './hub-filter-group'

type Props = {
  visible: boolean
  onClose: () => void
  category: JobCategory[]
  value: SheetFilters
  onApply: (f: SheetFilters) => void
}

const HubFilterSheet = ({ visible, onClose, category, value, onApply }: Props) => {
  const [draft, setDraft] = useState(value)
  const [opened, setOpened] = useState({ visible, value })
  if (opened.visible !== visible || opened.value !== value) {
    setOpened({ visible, value })
    if (visible) setDraft(value)
  }

  const total = useProfileCount([category, draft], profileQuery(category, draft), visible)
  const sent = useProfileCount(['offers'], { explore: 'offers' }, visible)

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
      <HubFilterGroup title="재직 기간">
        {TENURES.map((t) => (
          <Chip key={t.key} label={t.label} check on={draft.tenure.includes(t.key)} onPress={() => setDraft({ ...draft, tenure: toggle(draft.tenure, t.key) })} />
        ))}
      </HubFilterGroup>
      <HubFilterGroup title="커리어 상태">
        {CAREER_STATUSES.map((s) => (
          <Chip key={s.key} label={s.label} check on={draft.status.includes(s.key)} onPress={() => setDraft({ ...draft, status: toggle(draft.status, s.key) })} />
        ))}
      </HubFilterGroup>
      <HubFilterGroup title="탐색">
        <Chip label="추천" check on={draft.explore === 'recommended'} onPress={() => setDraft({ ...draft, explore: 'recommended' })} />
        <Chip label="제안" check on={draft.explore === 'offers'} onPress={() => setDraft({ ...draft, explore: 'offers' })} />
        {sent !== undefined ? (
          <Text v="c1" color="t3">
            보낸 제안 {sent}
          </Text>
        ) : null}
      </HubFilterGroup>
    </BottomSheet>
  )
}

export default HubFilterSheet

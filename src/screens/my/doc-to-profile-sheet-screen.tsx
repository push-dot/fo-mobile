import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  overwriteWarning,
  profilePatch,
  profileSections,
  replacedLabels,
  useApplyResumeProfile,
  useMyProfile,
  useResumeDraft,
  type ProfileSectionKey,
} from '@/features/my'
import { Icon, Sheet, Text } from '@/shared/components'
import { onAccent, spacing, useColors } from '@/theme'

const BOX = 24

const CheckRow = ({ label, sub, on, onPress }: { label: string; sub: string; on: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 52 }}
    >
      <View
        style={{
          width: BOX,
          height: BOX,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: on ? c.ac : undefined,
          borderWidth: on ? 0 : 2,
          borderColor: c.t4,
        }}
      >
        {on ? <Icon name="check" size={14} color={onAccent} /> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="600">
          {label}
        </Text>
        {sub ? (
          <Text v="c1" color="t3" numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}

const DocToProfileSheetScreen = () => {
  const c = useColors()
  const { id } = useLocalSearchParams<{ id: string }>()
  const draft = useResumeDraft(id).data?.profile
  const { data: me } = useMyProfile()
  const apply = useApplyResumeProfile(() => undefined)
  const sections = draft ? profileSections(draft) : []
  const [picked, setPicked] = useState<ProfileSectionKey[] | null>(null)
  if (!draft) return null
  const chosen = picked ?? sections.filter((s) => s.on).map((s) => s.key)
  const toggle = (key: ProfileSectionKey) => setPicked(chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key])
  const warning = overwriteWarning(replacedLabels(draft, me, chosen))
  return (
    <Sheet
      title="이 이력서로 프로필을 채울까요?"
      description="고른 항목만 허브 프로필에 반영돼요. 반영한 뒤에도 섹션별로 고칠 수 있어요."
      action={{
        label: `${chosen.length}개 항목 반영하기`,
        onPress: () => apply.mutate(profilePatch(draft, chosen)),
        disabled: chosen.length === 0 || apply.isPending,
      }}
    >
      <View>
        {sections.map((s) => (
          <CheckRow key={s.key} label={s.label} sub={s.sub} on={chosen.includes(s.key)} onPress={() => toggle(s.key)} />
        ))}
      </View>
      {warning ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[2],
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[4],
            borderRadius: 14,
            backgroundColor: c.orangeSoft,
          }}
        >
          <Text v="c1" weight="800" color="orange">
            !
          </Text>
          <Text v="c1" style={{ flex: 1 }}>
            {warning}
          </Text>
        </View>
      ) : null}
    </Sheet>
  )
}

export default DocToProfileSheetScreen

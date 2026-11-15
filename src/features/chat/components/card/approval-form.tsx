import { Pressable, View } from 'react-native'
import { Text } from '@/shared/components'
import { displayName } from '@/shared/utility/display-name'
import { spacing, useColors } from '../../../../theme'
import type { Approval } from '../../types'

type Props = {
  approval: Approval
  sel: number[][]
  onToggle: (section: number, index: number, multi?: boolean) => void
  /** A row's 변경 opens the material picker. */
  onChange: () => void
}

const Sub = ({ label }: { label: string }) => (
  <Text v="c1" color="t3" style={{ paddingTop: 10, paddingBottom: 2 }}>
    {label}
  </Text>
)

/** `.pm-tags span`: 36 high, 15 regular, the picked one filled with the ink colour. */
const Tag = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: on ? c.t1 : c.fill }}
    >
      <Text v="b2" style={{ color: on ? c.bg : c.t1 }}>
        {label}
      </Text>
    </Pressable>
  )
}

/** ChatPh0Input's body in the page-style modal (`.pm8`): sections under grey 13 labels, tags for the picks, plain rows for the materials with a grey 변경 at their right. */
const ApprovalForm = ({ approval, sel, onToggle, onChange }: Props) => {
  const c = useColors()
  return (
    <View style={{ gap: 6, paddingHorizontal: spacing[5] }}>
      {approval.sections.map((s, si) => {
        if (s.kind === 'chips')
          return (
            <View key={si} style={{ gap: 6 }}>
              {s.title && s.title !== approval.question ? <Sub label={s.title} /> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingVertical: spacing[1] }}>
                {s.options.map((o, i) => (
                  <Tag key={o} label={o} on={sel[si]!.includes(i)} onPress={() => onToggle(si, i, s.multi)} />
                ))}
              </View>
            </View>
          )
        if (s.kind !== 'rows') return null
        return (
          <View key={si} style={{ gap: 6 }}>
            <Sub label={s.title} />
            {s.items.map((r, i) => (
              <View key={r.id ?? r.title} style={{ minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderBottomWidth: i === s.items.length - 1 ? 0 : 1, borderBottomColor: c.line }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text v="h3" weight="400" numberOfLines={1}>
                    {displayName(r.title)}
                  </Text>
                  <Text v="c1" color="t3">
                    {r.sub}
                  </Text>
                </View>
                {r.action === 'change' ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`${displayName(r.title)} 변경`} onPress={onChange} hitSlop={12}>
                    <Text v="b2" color="t3">
                      변경
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        )
      })}
    </View>
  )
}

export default ApprovalForm

import { Pressable, ScrollView } from 'react-native'
import { radius, spacing, useColors } from '../../../theme'
import { Icon3D, Text } from '@/shared/components'
import { QUICK_STARTS, type QuickStart } from '../constants'

const COMPANY_CHIP_KEYS = ['fit', 'boost', 'exp'] as const

type Chip = Pick<QuickStart, 'key' | 'label' | 'icon'>

/** The previous design has 부족한 점 찾기 beside 적합도 보기; both open the 적합도 sheet, which already tells the gaps. */
const GAP_CHIP: Chip = { key: 'fit', label: '부족한 점 찾기', icon: 'qs-gap' }

export const quickStartsFor = (kind: 'push' | 'company'): Chip[] =>
  kind === 'push'
    ? QUICK_STARTS.flatMap((item) => (item.key === 'fit' ? [GAP_CHIP, item] : [item]))
    : COMPANY_CHIP_KEYS.flatMap((key) => {
        const row = QUICK_STARTS.find((item) => item.key === key)
        return row ? [row] : []
      })

/** One line of plain pills with their 3D icon right above the input (ChatBotOnboardPush, ChatBotOnboard): no glass. */
const QuickStartRow = ({ kind, onChip }: { kind: 'push' | 'company'; onChip: (key: string) => void }) => {
  const c = useColors()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="빠른 시작"
      // The composer's side padding is 12; the board's row starts 16 from the screen edge. The board's chips end 18 above the box, the area's own gap is 8.
      style={{ flexGrow: 0, marginHorizontal: -spacing[3], marginBottom: spacing[2] + 2 }}
      contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[4], paddingTop: spacing[2] }}
    >
      {quickStartsFor(kind).map((item) => (
        <Pressable
          key={item.label}
          accessibilityRole="button"
          onPress={() => onChip(item.key)}
          style={{ height: 52, paddingLeft: spacing[3], paddingRight: spacing[5], gap: spacing[2], borderRadius: radius.pill, backgroundColor: c.bg2, flexDirection: 'row', alignItems: 'center' }}
        >
          <Icon3D name={item.icon} size={30} />
          <Text v="b2" weight="600" numberOfLines={1}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

export default QuickStartRow

import { Pressable, ScrollView } from 'react-native'
import { radius, spacing, useColors } from '../../../theme'
import { Text } from '@/shared/components'
import { QUICK_STARTS } from '../constants'

const COMPANY_CHIP_KEYS = ['fit', 'gap', 'boost', 'exp'] as const

export const quickStartsFor = (kind: 'push' | 'company') =>
  kind === 'push'
    ? QUICK_STARTS
    : COMPANY_CHIP_KEYS.flatMap((key) => {
        const row = QUICK_STARTS.find((item) => item.key === key)
        return row ? [row] : []
      })

/** One line of plain pills right above the input (ChatBotOnboardPush, ChatBotOnboard): no glass, no icons. */
const QuickStartRow = ({ kind, onChip }: { kind: 'push' | 'company'; onChip: (key: string) => void }) => {
  const c = useColors()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="빠른 시작"
      // The composer's side padding is 12; the board's row starts 16 from the screen edge.
      style={{ flexGrow: 0, marginHorizontal: -spacing[3] }}
      contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[4], paddingTop: spacing[2] }}
    >
      {quickStartsFor(kind).map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          onPress={() => onChip(item.key)}
          style={{ height: 52, paddingHorizontal: spacing[5], borderRadius: radius.pill, backgroundColor: c.bg2, justifyContent: 'center' }}
        >
          <Text v="b2" weight="600" numberOfLines={1}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

export default QuickStartRow

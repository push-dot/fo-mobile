import { Pressable, ScrollView } from 'react-native'
import { radius, spacing, useColors } from '../../../theme'
import { Icon3D, Text } from '@/shared/components'
import { quickStartsFor } from '../utils/quick-start-chips'
import { quickStartMarginBottom } from '../utils/composer-geometry'

/** One line of plain pills with their 3D icon right above the input (ChatBotOnboardPush, ChatBotOnboard): no glass. */
const QuickStartRow = ({ kind, onChip }: { kind: 'push' | 'company'; onChip: (key: string) => void }) => {
  const c = useColors()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="빠른 시작"
      // The composer's side padding is 12; the board's row starts 16 from the screen edge.
      style={{ flexGrow: 0, marginHorizontal: -spacing[3], marginBottom: quickStartMarginBottom }}
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

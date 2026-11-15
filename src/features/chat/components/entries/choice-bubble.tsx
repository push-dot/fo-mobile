import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import type { Approval } from '../../types'
import { choiceSheet } from '../../utils/choice-sheet'
import { Bubble } from './bot'

/** The bot's question with its numbered options as one bubble under the last line (v425 `.mopts`); the first option is the suggested one. */
const ChoiceBubble = ({ approval, onPick }: { approval: Approval; onPick: (label: string, index: number) => void }) => {
  const c = useColors()
  const sheet = choiceSheet(approval)
  const section = approval.sections[0]
  if (!sheet || section?.kind !== 'choices') return null
  return (
    <Bubble gap={0}>
      <Text v="b1">{sheet.title}</Text>
      <View style={{ marginTop: 6 }}>
        {sheet.items.map((item, n) => {
          const on = section.selected.includes(item.index)
          return (
            <Pressable
              key={item.index}
              accessibilityRole="button"
              accessibilityLabel={`${n + 1}. ${item.label}`}
              onPress={() => onPick(item.label, item.index)}
              style={{ flexDirection: 'row', gap: 10, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}
            >
              <Text v="b1" color={on ? 'acText' : 't3'} style={{ width: 18, fontVariant: ['tabular-nums'] }}>
                {n + 1}
              </Text>
              <Text v="b1" weight={on ? '600' : '400'} color={on ? 'acText' : 't1'} style={{ flexShrink: 1, paddingRight: spacing[1] }}>
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </Bubble>
  )
}

export default ChoiceBubble

import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import type { Approval } from '../../types'
import { choiceMulti, choiceSheet } from '../../utils/choice-sheet'
import { isStop, multiPick } from '../../utils/multi-pick'
import { Bubble } from './bot'

type Props = { approval: Approval; onAnswer: (text: string, choice: number | number[]) => void }

const ROW_LINE = 22

const Row = ({ mark, label, on, onPress, number }: { mark?: string; label: string; on: boolean; onPress: () => void; number?: number }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole={mark ? 'checkbox' : 'button'}
      accessibilityState={mark ? { checked: on } : undefined}
      accessibilityLabel={number ? `${number}. ${label}` : label}
      onPress={onPress}
      style={{ flexDirection: 'row', gap: 10, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }}
    >
      <Text v="b1" weight={on ? '600' : '400'} color={on ? 'acText' : 't3'} style={{ width: 18, lineHeight: ROW_LINE, fontVariant: ['tabular-nums'] }}>
        {mark ?? number}
      </Text>
      <Text v="b1" weight={on ? '600' : '400'} color={on ? 'acText' : 't1'} style={{ flexShrink: 1, lineHeight: ROW_LINE, paddingRight: spacing[1] }}>
        {label}
      </Text>
    </Pressable>
  )
}

/** The bot's question with numbered options as one bubble under the last line (v425 `.mopts`); the first option is the suggested one. */
const Numbered = ({ approval, onAnswer }: Props) => {
  const sheet = choiceSheet(approval)
  const section = approval.sections[0]
  if (!sheet || section?.kind !== 'choices') return null
  return (
    <Bubble gap={0}>
      <Text v="b1">{sheet.title}</Text>
      <View style={{ marginTop: 6 }}>
        {sheet.items.map((item, n) => (
          <Row key={item.index} number={n + 1} label={item.label} on={section.selected.includes(item.index)} onPress={() => onAnswer(item.label, item.index)} />
        ))}
      </View>
      {approval.warning ? (
        <Text v="c1" color="t3" style={{ paddingTop: spacing[2] }}>
          {approval.warning}
        </Text>
      ) : null}
    </Bubble>
  )
}

/** ChatPh2XPrevent: checkboxes, the stop row, and "N개로 진행하기 ›" as the closing link. */
const Checklist = ({ approval, onAnswer }: Props) => {
  const section = approval.sections[0]
  const [sel, setSel] = useState<number[]>(() => (section?.kind === 'choices' ? section.selected : []))
  const multi = multiPick(approval, [sel])
  if (section?.kind !== 'choices') return null
  const toggle = (i: number) => setSel((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))
  const stop = () => (approval.secondary ? onAnswer(approval.secondary, 1) : onAnswer(multi.stopLabel!, multi.stopAt))
  return (
    <Bubble gap={0}>
      <Text v="b1">{approval.question}</Text>
      <View style={{ marginTop: 6 }}>
        {section.items.map((item, i) => (isStop(item) ? null : <Row key={item.label} mark={sel.includes(i) ? '☑' : '☐'} label={item.label} on={sel.includes(i)} onPress={() => toggle(i)} />))}
        {multi.stopLabel ? <Row label={multi.stopLabel} on={false} onPress={stop} /> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={multi.disabled}
        onPress={() => onAnswer(sel.map((i) => multi.items[i]!.label).join(', '), sel)}
        style={{ paddingTop: spacing[3] }}
      >
        <Text v="b1" weight="700" color={multi.disabled ? 't4' : 'acText'}>
          {multi.submitLabel} ›
        </Text>
      </Pressable>
    </Bubble>
  )
}

const ChoiceBubble = (props: Props) => (choiceMulti(props.approval) ? <Checklist {...props} /> : <Numbered {...props} />)

export default ChoiceBubble

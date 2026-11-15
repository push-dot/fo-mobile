import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import type { Approval } from '../../types'
import { choiceMulti, choiceSheet } from '../../utils/choice-sheet'
import { isStop, multiPick } from '../../utils/multi-pick'
import { Bubble } from './bot'

type Props = { approval: Approval; onAnswer: (text: string, choice: number | number[]) => void }

const ROW_LINE = 22
// The ☐ and ☑ come from a fallback font, which sits higher in a 22 line than the board's baseline-aligned glyph; the drop was measured on the device against the board.
const MARK_DROP = { off: 10 / 3, on: 5 / 3 }

const Row = ({ mark, label, on, onPress, number }: { mark?: string; label: string; on: boolean; onPress: () => void; number?: number }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole={mark ? 'checkbox' : 'button'}
      accessibilityState={mark ? { checked: on } : undefined}
      accessibilityLabel={number ? `${number}. ${label}` : label}
      onPress={onPress}
      style={{ flexDirection: 'row', gap: 10, paddingVertical: 9 }}
    >
      {/* The board's 1px box-shadow line sits above the row and takes no height. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -1, left: 0, right: 0, height: 1, backgroundColor: c.line }} />
      <Text
        v="b1"
        weight={on ? '600' : '400'}
        color={on ? 'acText' : 't3'}
        style={{ width: 18, lineHeight: ROW_LINE, fontVariant: ['tabular-nums'], top: mark ? MARK_DROP[on ? 'on' : 'off'] : 0 }}
      >
        {mark ?? number}
      </Text>
      <Text v="b1" weight={on ? '600' : '400'} color={on ? 'acText' : 't1'} style={{ flexShrink: 1, lineHeight: ROW_LINE }}>
        {label}
      </Text>
    </Pressable>
  )
}

/** The bot's question with numbered options as one bubble under the last line (v425 `.mopts`); the first option is the suggested one. The first row is 44 under the question: the bubble's gap 6 plus the list's margin 6. */
const Numbered = ({ approval, onAnswer }: Props) => {
  const sheet = choiceSheet(approval)
  const section = approval.sections[0]
  if (!sheet || section?.kind !== 'choices') return null
  return (
    <Bubble>
      <Text v="b1">{sheet.title}</Text>
      <View style={{ marginTop: 6 }}>
        {sheet.items.map((item, n) => (
          <Row key={item.index} number={n + 1} label={item.label} on={section.selected.includes(item.index)} onPress={() => onAnswer(item.label, item.index)} />
        ))}
      </View>
      {approval.warning ? (
        <Text v="c1" color="t3" style={{ paddingTop: 2 }}>
          {approval.warning}
        </Text>
      ) : null}
    </Bubble>
  )
}

/** ChatPh2XPrevent: the checkboxes, the stop row as a list of its own (6 gap + 6 margin under them), and "N개로 진행하기 ›" as the closing link (margin 8). */
const Checklist = ({ approval, onAnswer }: Props) => {
  const section = approval.sections[0]
  const [sel, setSel] = useState<number[]>(() => (section?.kind === 'choices' ? section.selected : []))
  const multi = multiPick(approval, [sel])
  if (section?.kind !== 'choices') return null
  const toggle = (i: number) => setSel((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))
  const stop = () => (approval.secondary ? onAnswer(approval.secondary, 1) : onAnswer(multi.stopLabel!, multi.stopAt))
  return (
    <Bubble>
      <Text v="b1">{approval.question}</Text>
      <View style={{ marginTop: 6 }}>
        {section.items.map((item, i) => (isStop(item) ? null : <Row key={item.label} mark={sel.includes(i) ? '☑' : '☐'} label={item.label} on={sel.includes(i)} onPress={() => toggle(i)} />))}
      </View>
      {multi.stopLabel ? (
        <View style={{ marginTop: 6 }}>
          <Row label={multi.stopLabel} on={false} onPress={stop} />
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={multi.disabled}
        onPress={() => onAnswer(sel.map((i) => multi.items[i]!.label).join(', '), sel)}
        style={{ paddingTop: spacing[2] }}
      >
        <Text v="b1" weight="600" color={multi.disabled ? 't4' : 'acText'} style={{ lineHeight: ROW_LINE }}>
          {multi.submitLabel} ›
        </Text>
      </Pressable>
    </Bubble>
  )
}

const ChoiceBubble = (props: Props) => (choiceMulti(props.approval) ? <Checklist {...props} /> : <Numbered {...props} />)

export default ChoiceBubble

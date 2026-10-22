import { useEffect, useState } from 'react'
import { Animated, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, useColors } from '../../theme'
import { Badge, Button, Glass, Icon, Text } from '@/shared/components'
import { FileTag } from './items'
import { SPRING, useReduceMotion } from './motion'
import type { Approval, ApprovalSection, Choice } from './types'

type Props = {
  approval: Approval
  /** Picked an answer: `text` becomes the user bubble, `choice` the index sent back. */
  onAnswer: (text: string, choice: number) => void
  /** "직접 말하기" / 변경: hand the floor back to the composer. */
  onSay: () => void
}

const isSay = (c: Choice) => c.label === '직접 말하기' || c.hint === '직접 말하기'

/** Replaces the composer until answered (design_system ApprovalPanel). */
export const ApprovalPanel = ({ approval, onAnswer, onSay }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const reduce = useReduceMotion()
  const rise = useState(() => new Animated.Value(0))[0]
  const [sel, setSel] = useState(() => approval.sections.map((s) => ('selected' in s ? s.selected : [])))
  const numbered = !approval.submit && approval.sections.length === 1 && approval.sections[0]!.kind === 'choices' && !approval.sections[0]!.multi

  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 420, easing: SPRING, useNativeDriver: true }).start()
  }, [rise])

  const toggle = (si: number, i: number, multi?: boolean) =>
    setSel((all) => all.map((cur, k) => (k !== si ? cur : multi ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]) : [i])))

  const pickNumbered = (i: number, ch: Choice) => {
    if (isSay(ch)) return onSay()
    toggle(0, i)
    // Let the 150ms selection land before the panel leaves.
    setTimeout(() => onAnswer(ch.label, i), 150)
  }

  const section = (s: ApprovalSection, si: number) => {
    switch (s.kind) {
      case 'choices':
        return s.items.map((ch, i) => (
          <ChoiceRow
            key={`${si}-${i}`}
            n={numbered ? i + 1 : undefined}
            choice={ch}
            on={sel[si]!.includes(i)}
            square={!numbered}
            onPress={() => (numbered ? pickNumbered(i, ch) : toggle(si, i, s.multi))}
          />
        ))
      case 'chips':
        return (
          <View key={si}>
            {s.title ? <Sub label={s.title} /> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 4, paddingVertical: 4 }}>
              {s.options.map((o, i) => (
                <MiniChip key={o} label={o} on={sel[si]!.includes(i)} onPress={() => toggle(si, i, s.multi)} />
              ))}
            </View>
          </View>
        )
      case 'rows':
        return (
          <View key={si}>
            <Sub label={s.title} />
            {s.items.map((r) => (
              <View key={r.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 4 }}>
                {r.tag === 'link' ? (
                  <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="link" size={16} color="t2" />
                  </View>
                ) : r.tag.length === 1 ? (
                  <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: '#1F3A8A', alignItems: 'center', justifyContent: 'center' }}>
                    <Text weight="800" style={{ color: '#FFFFFF', fontSize: 12 }}>
                      {r.tag}
                    </Text>
                  </View>
                ) : (
                  <FileTag tag={r.tag} w={28} h={34} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text v="b2" weight="700" numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text v="c2" weight="700" color={r.ac ? 'acText' : 't3'}>
                    {r.sub}
                  </Text>
                </View>
                <MiniChip label="변경" onPress={onSay} />
              </View>
            ))}
          </View>
        )
      case 'templates':
        return (
          <View key={si} style={{ flexDirection: 'row', gap: 6, paddingBottom: 4 }}>
            {s.items.map((t, i) => (
              <Template key={t.label} label={t.label} recommended={t.recommended} on={sel[si]!.includes(i)} variant={i} onPress={() => toggle(si, i)} />
            ))}
          </View>
        )
    }
  }

  const body = (
    <View style={{ gap: 6, paddingTop: ios ? 22 : 20, paddingHorizontal: ios ? 14 : 16, paddingBottom: ios ? 18 : insets.bottom + 12 }}>
      <Text v="h3" accessibilityRole="header" style={{ fontSize: 18, lineHeight: 26, paddingHorizontal: 4, paddingBottom: 8 }}>
        {approval.question}
      </Text>
      {approval.sections.map(section)}
      {approval.submit ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {approval.secondary ? (
            <Button style={{ flex: 1 }} variant="secondary" label={approval.secondary} onPress={() => onAnswer(approval.secondary!, 1)} />
          ) : null}
          <Button style={{ flex: 1 }} label={approval.submit} onPress={() => onAnswer(approval.answer ?? approval.submit!, 0)} />
        </View>
      ) : null}
      {approval.foot ? (
        <Text v="c2" color="t4" style={{ textAlign: 'center', paddingTop: 6 }}>
          {approval.foot}
        </Text>
      ) : null}
    </View>
  )

  const motion = reduce
    ? { opacity: rise }
    : { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }

  return (
    <Animated.View
      accessibilityViewIsModal
      accessibilityLabel="확인 요청"
      style={[
        ios
          ? { marginHorizontal: 8, marginBottom: Math.max(insets.bottom - 18, 8) }
          : { backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, elevation: 12 },
        motion,
      ]}
    >
      {ios ? (
        <Glass surface="sheet" style={{ borderRadius: 40 }}>
          {body}
        </Glass>
      ) : (
        body
      )}
    </Animated.View>
  )
}

const Sub = ({ label }: { label: string }) => (
  <Text v="c1" weight="700" color="t3" style={{ paddingTop: 10, paddingHorizontal: 4, paddingBottom: 2 }}>
    {label}
  </Text>
)

const ChoiceRow = ({ n, choice, on, square, onPress }: { n?: number; choice: Choice; on: boolean; square: boolean; onPress: () => void }) => {
  const c = useColors()
  const two = !!choice.desc
  return (
    <Pressable
      accessibilityRole={square ? 'checkbox' : 'button'}
      accessibilityState={square ? { checked: on } : { selected: on }}
      accessibilityLabel={n ? `${n}. ${choice.label}` : choice.label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: two ? 'flex-start' : 'center',
        gap: 12,
        minHeight: two ? 64 : 52,
        paddingHorizontal: 14,
        paddingVertical: two ? 12 : 0,
        borderRadius: 14,
        backgroundColor: on ? c.acSoft : 'transparent',
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: square ? 7 : 8,
          marginTop: two ? 1 : 0,
          backgroundColor: on ? c.ac : c.fill,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {n ? (
          <Text v="c1" weight="800" style={{ color: on ? '#FFFFFF' : c.t2 }}>
            {n}
          </Text>
        ) : on ? (
          <Icon name="check" size={14} color="#FFFFFF" />
        ) : null}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text v="b1" weight="600" color={on ? 'acText' : 't1'} style={{ lineHeight: 22 }}>
          {choice.label}
        </Text>
        {choice.desc ? (
          <Text v="c1" weight="500" color={on ? 'acText' : 't3'} style={on ? { opacity: 0.85 } : undefined}>
            {choice.desc}
          </Text>
        ) : null}
      </View>
      {choice.hint ? (
        <Text v="c1" weight="500" color="t3">
          {choice.hint}
        </Text>
      ) : null}
      {choice.badge ? <Badge label={choice.badge.label} tone={choice.badge.tone} /> : null}
    </Pressable>
  )
}

const MiniChip = ({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      hitSlop={8}
      style={{ height: 28, paddingHorizontal: 10, borderRadius: 14, justifyContent: 'center', backgroundColor: on ? c.t1 : c.fill }}
    >
      <Text v="c1" weight="600" style={{ color: on ? c.bg : c.t2 }}>
        {label}
      </Text>
    </Pressable>
  )
}

/** Tiny page preview per template (ChatPh4Design). */
const Template = ({ label, recommended, on, variant, onPress }: { label: string; recommended?: boolean; on: boolean; variant: number; onPress: () => void }) => {
  const c = useColors()
  const line = (w: string | number, key: number) => <View key={key} style={{ height: 4, width: w as number, borderRadius: 2, backgroundColor: c.fill2 }} />
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={recommended ? `${label}, 추천` : label}
      onPress={onPress}
      style={{ flex: 1, gap: 8, padding: 8, borderRadius: radius.md, backgroundColor: on ? c.acSoft : 'transparent', borderWidth: 2, borderColor: on ? c.ac : 'transparent' }}
    >
      <View style={{ aspectRatio: 0.75, borderRadius: 6, backgroundColor: c.paper, borderWidth: 1, borderColor: c.line, padding: 6, gap: 4 }}>
        {variant === 1 ? <View style={{ height: 10, borderRadius: 2, backgroundColor: c.acSoft }} /> : null}
        {variant === 2 ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.fill2 }} /> : null}
        {['100%', '80%', '100%', '60%', '90%'].map((w, i) => line(w, i))}
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        {recommended ? <Badge label="추천" tone="ac" /> : null}
        <Text v="c1" weight="700">
          {label}
        </Text>
      </View>
    </Pressable>
  )
}

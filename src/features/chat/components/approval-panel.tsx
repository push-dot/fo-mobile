import { useEffect, useState } from 'react'
import { Animated, Easing, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, selectedRing, useColors } from '../../../theme'
import { Badge, Button, Glass, Icon, Text, hitSlopTo } from '@/shared/components'
import { SPRING } from '../constants'
import { useReduceMotion } from '../hooks'
import type { Approval, ApprovalSection, Choice } from '../types'
import { chipSends as sendsOnChip, sectionLabel, sectionPicks } from '../utils/stream-v3'

type Props = {
  approval: Approval
  /** Picked an answer: `text` becomes the user bubble, `choice` the index or indexes sent back. */
  onAnswer: (text: string, choice: number | number[]) => void
  /** "직접 말하기": hand the floor back to the composer. */
  onSay: () => void
  /** A material row's 변경: pick another material (자료 고르기). */
  onMaterials: () => void
}

const isSay = (c: Choice) => c.label === '직접 말하기' || c.hint === '직접 말하기'
const isStop = (c: Choice) => c.label === '그만하기' || c.label === '그만할게요'

/** Replaces the composer until answered (design_system ApprovalPanel). */
export const ApprovalPanel = ({ approval, onAnswer, onSay, onMaterials }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const reduce = useReduceMotion()
  const rise = useState(() => new Animated.Value(0))[0]
  const [sel, setSel] = useState(() => approval.sections.map((s) => ('selected' in s ? s.selected : [])))
  const numbered = !approval.submit && approval.sections.length === 1 && approval.sections[0]!.kind === 'choices' && !approval.sections[0]!.multi
  // push-be #224 section card (10-02, 10-21, 10-22): answered with submit + picked ids; cancel is its own button or chip.
  const sectioned = approval.sections.some((s) => s.kind !== 'choices')
  const last = approval.sections.at(-1)
  // ChatPh0Input has no confirm button: tapping the closing single-pick chip (말투) sends the card.
  const chipSends = sectioned && sendsOnChip(approval)
  const cancel = () => onAnswer(approval.secondary!, approval.optionIds?.indexOf('cancel') ?? -1)
  const sendSections = (picks: number[][]) => onAnswer(sectionLabel(approval, picks), sectionPicks(approval, picks))
  const sectionSubmit = sectioned && approval.submit && !chipSends ? sectionLabel(approval, sel) : undefined

  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 420, easing: Easing.bezier(...SPRING), useNativeDriver: true }).start()
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
            onPress={() => {
              if (numbered) return pickNumbered(i, ch)
              if (s.multi && isStop(ch)) return onAnswer(ch.label, i)
              toggle(si, i, s.multi)
            }}
          />
        ))
      case 'chips': {
        // The first chips title is usually the card question; don't print it twice.
        const title = s.title && s.title !== approval.question ? s.title : undefined
        const stop = sectioned ? approval.secondary : undefined
        if (s.multi)
          return (
            <View key={si} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {title ? <Question label={title} /> : null}
              {s.options.map((o, i) => (
                <View key={o} style={{ width: '48.5%' }}>
                  <ChoiceRow choice={{ label: o }} on={sel[si]!.includes(i)} square onPress={() => toggle(si, i, true)} />
                </View>
              ))}
              {stop ? (
                <View style={{ width: '48.5%' }}>
                  <ChoiceRow choice={{ label: stop }} on={false} square bare onPress={cancel} />
                </View>
              ) : null}
            </View>
          )
        return (
          <View key={si}>
            {title ? <Question label={title} /> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 4, paddingVertical: 4 }}>
              {s.options.map((o, i) => (
                <MiniChip
                  key={o}
                  label={o}
                  on={sel[si]!.includes(i)}
                  onPress={() => {
                    if (!chipSends || s !== last) return toggle(si, i)
                    const picks = sel.map((cur, k) => (k === si ? [i] : cur))
                    setSel(picks)
                    setTimeout(() => sendSections(picks), 150)
                  }}
                />
              ))}
              {stop && s === last ? <MiniChip label={stop} onPress={cancel} /> : null}
            </View>
          </View>
        )
      }
      case 'rows':
        return (
          <View key={si}>
            <Sub label={s.title} />
            {s.items.map((r) => (
              <View key={r.id ?? r.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 4 }}>
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
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text v="b2" weight="700" numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text v="c2" weight="700" color={r.ac ? 'acText' : 't3'}>
                    {r.sub}
                  </Text>
                </View>
                {r.action === 'change' ? <MiniChip label="변경" onPress={onMaterials} /> : null}
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
      case 'toggle':
        return s.items.map((ch, i) => <ChoiceRow key={`${si}-${i}`} choice={ch} on={sel[si]!.includes(i)} square onPress={() => toggle(si, i, true)} />)
    }
  }

  const body = (
    <View style={{ gap: 6, paddingTop: ios ? 22 : 20, paddingHorizontal: ios ? 14 : 16, paddingBottom: ios ? 18 : insets.bottom + 12 }}>
      <Text v="h3" accessibilityRole="header" style={{ fontSize: 18, lineHeight: 26, paddingHorizontal: 4, paddingBottom: 8 }}>
        {approval.question}
      </Text>
      {approval.detail ? (
        <Text v="b2" color="t2" style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
          {approval.detail}
        </Text>
      ) : null}
      {approval.sections.map(section)}
      {sectioned ? (
        <View style={{ gap: 8, marginTop: 4 }}>
          {sectionSubmit ? <Button label={sectionSubmit} onPress={() => sendSections(sel)} /> : null}
          {approval.secondary && !approval.sections.some((s) => s.kind === 'chips') ? <Button variant="secondary" label={approval.secondary} onPress={cancel} /> : null}
        </View>
      ) : approval.submit ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {approval.secondary ? (
            <Button style={{ flex: 1 }} variant="secondary" label={approval.secondary} onPress={() => onAnswer(approval.secondary!, 1)} />
          ) : null}
          <Button
            style={{ flex: 1 }}
            label={approval.submit}
            disabled={approval.sections.some((s, i) => s.kind === 'choices' && s.multi && !(sel[i]?.length))}
            onPress={() => {
              const si = approval.sections.findIndex((s) => s.kind === 'choices' && s.multi)
              const section = si >= 0 ? approval.sections[si] : undefined
              if (section?.kind === 'choices') {
                const picks = sel[si] ?? []
                if (!picks.length) return
                onAnswer(picks.map((i) => section.items[i]!.label).join(', '), picks)
                return
              }
              onAnswer(approval.answer ?? approval.submit!, 0)
            }}
          />
        </View>
      ) : null}
      {approval.warning ? (
        <Text v="c1" weight="600" color="t2" style={{ textAlign: 'center', paddingTop: 6 }}>
          {approval.warning}
        </Text>
      ) : approval.foot ? (
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

const Question = ({ label }: { label: string }) => (
  <Text v="h3" style={{ width: '100%', fontSize: 18, lineHeight: 26, paddingTop: 12, paddingHorizontal: 4, paddingBottom: 8 }}>
    {label}
  </Text>
)

const Sub = ({ label }: { label: string }) => (
  <Text v="c1" weight="700" color="t3" style={{ paddingTop: 10, paddingHorizontal: 4, paddingBottom: 2 }}>
    {label}
  </Text>
)

const ChoiceRow = ({ n, choice, on, square, bare, onPress }: { n?: number; choice: Choice; on: boolean; square: boolean; bare?: boolean; onPress: () => void }) => {
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
        ...(on ? selectedRing(c) : { borderWidth: selectedRing(c).borderWidth, borderColor: 'transparent' }),
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {bare ? null : (
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
      )}
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
      hitSlop={hitSlopTo(28)}
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
      style={{ flex: 1, gap: 8, padding: 8, borderRadius: radius.md, ...(on ? selectedRing(c) : { borderWidth: selectedRing(c).borderWidth, borderColor: 'transparent' }) }}
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

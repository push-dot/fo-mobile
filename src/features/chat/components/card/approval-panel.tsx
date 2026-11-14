import { Children, useEffect, useState, type ReactNode } from 'react'
import { Animated, Easing, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cssShadow, onAccent, radius, selectedRing, spacing, type, useColors, useShadow } from '../../../../theme'
import { Badge, Button, Icon, Text, hitSlopTo, useReduceMotion } from '@/shared/components'
import { SPRING } from '../../constants'
import { RISE_MS, riseOnMount } from './approval-rise'
import { expiredNote } from '../../utils/card'
import type { Approval, ApprovalSection, Choice } from '../../types'
import { isStop, multiPick } from '../../utils/multi-pick'
import { chipSends as sendsOnChip, sectionLabel, sectionPicks } from '../../utils/stream-v3'

type Props = {
  approval: Approval
  /** Picked an answer: `text` becomes the user bubble, `choice` the index or indexes sent back. */
  onAnswer: (text: string, choice: number | number[]) => void
  /** "직접 말하기": hand the floor back to the composer. */
  onSay: () => void
  /** A material row's 변경: pick another material (자료 고르기). */
  onMaterials: () => void
  /** Past `expiresAt` (cardState): the answers go grey and 닫기 / 다시 요청 take their place. */
  expired?: boolean
  /** 닫기: answers reject, so the run that asked can end. */
  onClose?: () => void
  /** 다시 요청: asks the same card again for the same span. */
  onRetry?: () => void
}

// `.panel { gap: 6px }`: between the panel's blocks and inside each section.
const PANEL_GAP = 6
// The foot sits 14pt under the grid: panel gap 6 + 6 + 2.
const FOOT_TOP = 6
// The board pads 그만하기 22pt per side; the Button gives 20.
const STOP_PAD = { paddingHorizontal: 2 }

const isSay = (c: Choice) => c.label === '직접 말하기' || c.hint === '직접 말하기'
/** Replaces the composer until answered (design_system ApprovalPanel). */
export const ApprovalPanel = ({ approval, onAnswer, onSay, onMaterials, expired = false, onClose, onRetry }: Props) => {
  const c = useColors()
  const shadow = useShadow()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const reduce = useReduceMotion()
  const rise = useState(() => new Animated.Value(0))[0]
  // Once the rise is over the panel uses a static style, whatever the native animation did (see riseOnMount).
  const [landed, setLanded] = useState(false)
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
  const multi = multiPick(approval, sel)
  const submitRow = !sectioned && !!approval.submit

  // The rise starts at mount and the end state is forced after RISE_MS + RISE_SLACK_MS (see riseOnMount): the panel must open every time.
  useEffect(
    () => riseOnMount(rise, () => Animated.timing(rise, { toValue: 1, duration: RISE_MS, easing: Easing.bezier(...SPRING), useNativeDriver: false }).start(), () => setLanded(true)),
    [rise],
  )

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
      case 'choices': {
        const rows = s.items.map((ch, i) => (
          <ChoiceRow
            key={`${si}-${i}`}
            disabled={expired}
            n={numbered ? i + 1 : undefined}
            choice={expired ? { label: ch.label } : ch}
            on={sel[si]!.includes(i)}
            square={!numbered}
            bare={!!s.multi && isStop(ch)}
            onPress={() => {
              if (numbered) return pickNumbered(i, ch)
              if (s.multi && isStop(ch)) return onAnswer(ch.label, i)
              toggle(si, i, s.multi)
            }}
          />
        ))
        if (!s.multi) return rows
        const stops = s.items.flatMap((ch, i) => (isStop(ch) ? [i] : []))
        return (
          <MultiGrid key={si} stop={stops.length && !submitRow ? <View style={{ marginTop: 2 }}>{rows[stops[0]!]}</View> : undefined}>
            {rows.filter((_, i) => !stops.includes(i))}
          </MultiGrid>
        )
      }
      case 'chips': {
        // The first chips title is usually the card question; don't print it twice.
        const title = s.title && s.title !== approval.question ? s.title : undefined
        const stop = sectioned ? approval.secondary : undefined
        if (s.multi) {
          const stopRow = stop ? <ChoiceRow choice={{ label: stop }} on={false} square bare center onPress={cancel} /> : null
          const inGrid = s.options.length % 2 === 1
          return (
            <View key={si} style={{ gap: PANEL_GAP }}>
              {title ? <Question label={title} /> : null}
              <MultiGrid stop={stopRow && !inGrid ? <View style={{ marginTop: 2 }}>{stopRow}</View> : undefined}>
                {s.options.map((o, i) => (
                  <ChoiceRow key={o} choice={{ label: o }} on={sel[si]!.includes(i)} square center onPress={() => toggle(si, i, true)} />
                ))}
                {stopRow && inGrid ? stopRow : null}
              </MultiGrid>
            </View>
          )
        }
        return (
          <View key={si} style={{ gap: PANEL_GAP }}>
            {title ? <Question label={title} /> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingHorizontal: spacing[1], paddingBottom: spacing[1] }}>
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
          <View key={si} style={{ gap: PANEL_GAP }}>
            <Sub label={s.title} />
            {s.items.map((r) => (
              <View key={r.id ?? r.title} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2], paddingHorizontal: spacing[1] }}>
                {r.tag === 'link' ? (
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="at" size={16} color="t2" />
                  </View>
                ) : r.tag.length === 1 ? (
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.ac, alignItems: 'center', justifyContent: 'center' }}>
                    <Text v="c1" weight="800" style={{ color: onAccent }}>
                      {r.tag}
                    </Text>
                  </View>
                ) : null}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text v="b2" weight="700" numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text v="c2" weight={r.ac ? '700' : '400'} color={r.ac ? 't1' : 't3'}>
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
          <View key={si} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingHorizontal: spacing[1], paddingBottom: spacing[1] }}>
            {s.items.map((t, i) => (
              <TemplateChip key={t.label} label={t.label} recommended={t.recommended} on={sel[si]!.includes(i)} onPress={() => toggle(si, i)} />
            ))}
          </View>
        )
      case 'toggle':
        return s.items.map((ch, i) => <ChoiceRow key={`${si}-${i}`} choice={ch} on={sel[si]!.includes(i)} square onPress={() => toggle(si, i, true)} />)
    }
  }

  const body = (
    <View style={{ gap: PANEL_GAP, paddingTop: ios ? 22 : spacing[5], paddingHorizontal: ios ? 14 : spacing[4], paddingBottom: ios ? 18 : insets.bottom + spacing[3] }}>
      {expired ? (
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing[1], paddingBottom: spacing[2] }}>
          <Badge label="만료됨" tone="grey" />
        </View>
      ) : null}
      <Text v="h3" accessibilityRole="header" color={expired ? 't3' : 't1'} style={{ fontSize: 18, lineHeight: 26, paddingHorizontal: spacing[1], paddingBottom: spacing[2] }}>
        {approval.question}
      </Text>
      {expired || approval.detail ? (
        <Text v="c1" color="t3" style={{ paddingHorizontal: spacing[1], paddingBottom: 6, marginTop: -PANEL_GAP }}>
          {expired ? expiredNote(approval) : approval.detail}
        </Text>
      ) : null}
      {approval.sections.map(section)}
      {expired ? (
        <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] }}>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" label="닫기" onPress={() => onClose?.()} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="다시 요청" onPress={() => onRetry?.()} />
          </View>
        </View>
      ) : sectioned ? (
        <View style={{ gap: spacing[2], marginTop: spacing[1] }}>
          {sectionSubmit ? <Button label={sectionSubmit} onPress={() => sendSections(sel)} /> : null}
          {approval.secondary && !approval.sections.some((s) => s.kind === 'chips') ? <Button variant="secondary" label={approval.secondary} onPress={cancel} /> : null}
        </View>
      ) : approval.submit ? (
        <>
          {multi.at >= 0 && approval.foot ? (
            <Text v="c2" color="t3" style={{ textAlign: 'center', paddingTop: FOOT_TOP, marginTop: 2 }}>
              {approval.foot}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: multi.at >= 0 ? spacing[1] : 2, paddingHorizontal: multi.at >= 0 ? 0 : spacing[1] }}>
            {multi.stopLabel ? (
              <View style={multi.at >= 0 ? STOP_PAD : { flex: 1 }}>
                <Button
                  variant="secondary"
                  label={multi.stopLabel}
                  onPress={() => (approval.secondary ? onAnswer(approval.secondary, 1) : onAnswer(multi.stopLabel!, multi.stopAt))}
                />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Button
                label={multi.submitLabel!}
                disabled={multi.disabled}
                onPress={() => {
                  if (multi.at >= 0) {
                    const picks = sel[multi.at] ?? []
                    if (!picks.length) return
                    onAnswer(picks.map((i) => multi.items[i]!.label).join(', '), picks)
                    return
                  }
                  onAnswer(approval.answer ?? approval.submit!, 0)
                }}
              />
            </View>
          </View>
        </>
      ) : null}
      {expired ? null : approval.warning ? (
        <Text v="c1" weight="600" color="t2" style={{ textAlign: 'center', paddingTop: 6 }}>
          {approval.warning}
        </Text>
      ) : approval.foot && !(submitRow && multi.at >= 0) ? (
        <Text v="c2" color="t3" style={{ textAlign: 'center', paddingTop: 6 }}>
          {approval.foot}
        </Text>
      ) : null}
    </View>
  )

  // The landed style is explicit: a view that once had native-driven props keeps their last value when a prop turns undefined.
  const motion = landed
    ? { opacity: 1, transform: [{ translateY: 0 }] }
    : reduce
      ? { opacity: rise }
      : { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }

  return (
    <Animated.View
      accessibilityViewIsModal
      accessibilityLabel={expired ? '만료된 요청' : '확인 요청'}
      style={[
        ios
          ? { marginHorizontal: spacing[2], marginBottom: spacing[2], backgroundColor: c.bg, borderRadius: 40, borderWidth: 1, borderColor: c.line, ...shadow.pop, shadowOffset: { width: 0, height: -4 } }
          : { backgroundColor: c.bg, borderTopLeftRadius: radius.confirmPanelTop, borderTopRightRadius: radius.confirmPanelTop, boxShadow: cssShadow.approvalSheet },
        motion,
      ]}
    >
      {body}
    </Animated.View>
  )
}

const MultiGrid = ({ children, stop }: { children: ReactNode; stop?: ReactNode }) => (
  <View style={{ gap: spacing[2] }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
      {Children.map(children, (child) => (child ? <View style={{ width: '48.5%' }}>{child}</View> : null))}
    </View>
    {stop}
  </View>
)

const Question = ({ label }: { label: string }) => (
  <Text v="h3" style={{ width: '100%', fontSize: 18, lineHeight: 26, paddingTop: spacing[3], paddingHorizontal: spacing[1], paddingBottom: spacing[2] }}>
    {label}
  </Text>
)

const Sub = ({ label }: { label: string }) => (
  <Text v="c1" weight="700" color="t3" style={{ paddingTop: 10, paddingHorizontal: spacing[1], paddingBottom: 2 }}>
    {label}
  </Text>
)

const ChoiceRow = ({ n, choice, on, square, bare, center, disabled, onPress }: { n?: number; choice: Choice; on: boolean; square: boolean; bare?: boolean; center?: boolean; disabled?: boolean; onPress: () => void }) => {
  const c = useColors()
  const ring = selectedRing(c)
  const two = !!choice.desc
  const paleNumber = Platform.OS === 'ios' && !square
  return (
    <Pressable
      accessibilityRole={square ? 'checkbox' : 'button'}
      accessibilityState={square ? { checked: on } : { selected: on }}
      accessibilityLabel={n ? `${n}. ${choice.label}` : choice.label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : 1,
        flexDirection: 'row',
        alignItems: two ? 'flex-start' : 'center',
        justifyContent: center ? 'center' : undefined,
        gap: center ? spacing[2] : spacing[3],
        minHeight: two ? 64 : 52,
        paddingHorizontal: (center ? spacing[2] : 14) - ring.borderWidth,
        paddingVertical: two ? spacing[3] - ring.borderWidth : 0,
        borderRadius: 14,
        ...(on ? ring : { borderWidth: ring.borderWidth, borderColor: 'transparent' }),
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
            backgroundColor: on && !paleNumber ? c.ac : c.fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {n ? (
            <Text v="c1" weight="800" style={{ color: on ? onAccent : c.t2 }}>
              {n}
            </Text>
          ) : on ? (
            <Icon name="check" size={14} color={onAccent} />
          ) : null}
        </View>
      )}
      <View style={{ flex: center ? undefined : 1, flexShrink: 1, minWidth: 0, gap: 2 }}>
        <Text v="b1" weight="600" color={on ? 'acText' : 't1'} style={{ lineHeight: type.b2.lineHeight }}>
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

/** A template is a word, not a drawing (ChatPh4Design): one chip row, the recommended one carries "· 추천". */
const TemplateChip = ({ label, recommended, on, onPress }: { label: string; recommended?: boolean; on: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={recommended ? `${label}, 추천` : label}
      onPress={onPress}
      hitSlop={hitSlopTo(34)}
      style={{ height: 34, paddingHorizontal: 14, borderRadius: radius.chip, justifyContent: 'center', backgroundColor: on ? c.t1 : c.fill }}
    >
      <Text v="c1" weight="600" style={{ fontSize: 14, color: on ? c.bg : c.t1 }}>
        {label}
        {recommended ? <Text v="c1" style={{ fontSize: 14, color: on ? c.bg : c.t3, opacity: on ? 0.7 : 1 }}>{` · 추천`}</Text> : null}
      </Text>
    </Pressable>
  )
}

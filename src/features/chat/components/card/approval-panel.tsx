import { Children, useEffect, useState, type ReactNode } from 'react'
import { Animated, Easing, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cssShadow, onAccent, radius, selectedRing, spacing, type, useColors } from '../../../../theme'
import { Badge, Button, Icon, Text, hitSlopTo, useReduceMotion } from '@/shared/components'
import { showChoiceModal } from '@/shared/navigation'
import { SPRING } from '../../constants'
import ApprovalModal from './approval-modal'
import { RISE_MS, riseOnMount } from './approval-rise'
import type { Approval, ApprovalSection, Choice } from '../../types'
import { choiceSheet, confirmModal } from '../../utils/choice-sheet'
import { approvalModalKind } from '../../utils/approval-modal'
import { isStop, multiPick } from '../../utils/multi-pick'
import { chipSends as sendsOnChip, sectionLabel, sectionPicks } from '../../utils/stream-v3'

type Props = {
  approval: Approval
  /** Picked an answer: `text` becomes the user bubble, `choice` the index or indexes sent back. */
  onAnswer: (text: string, choice: number | number[]) => void
  /** "직접 말하기": hand the floor back to the composer. */
  onSay: () => void
  /** A material row's 변경: the picker page (자료 고르기) drawn inside the form's own modal. `onClose` returns to the form. */
  renderPicker: (onClose: () => void) => ReactNode
}

// `.panel { gap: 6px }`: between the panel's blocks and inside each section.
const PANEL_GAP = 6
// The foot sits 14pt under the grid: panel gap 6 + 6 + 2.
const FOOT_TOP = 6
// The board pads 그만하기 22pt per side; the Button gives 20.
const STOP_PAD = { paddingHorizontal: 2 }

/** Replaces the composer until answered (design_system ApprovalPanel). */
export const ApprovalPanel = ({ approval, onAnswer, onSay, renderPicker }: Props) => {
  const c = useColors()
    const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const reduce = useReduceMotion()
  const rise = useState(() => new Animated.Value(0))[0]
  // Once the rise is over the panel uses a static style, whatever the native animation did (see riseOnMount).
  const [landed, setLanded] = useState(false)
  const modal = approvalModalKind(approval)
  const [picking, setPicking] = useState(false)
  const [sel, setSel] = useState(() => approval.sections.map((s) => ('selected' in s ? s.selected : [])))
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
  // Reduce Motion lands it at once (the static style below); it reaches the hook after mount, so the rise may already be running: stop it.
  useEffect(() => {
    if (reduce) {
      rise.stopAnimation()
      return
    }
    const stop = riseOnMount(rise, () => Animated.timing(rise, { toValue: 1, duration: RISE_MS, easing: Easing.bezier(...SPRING), useNativeDriver: false }).start(), () => setLanded(true))
    return () => (stop(), rise.stopAnimation())
  }, [rise, reduce])

  // A single-pick card the bot has no suggestion for (a help question, a page permission) and an edit card are regular modals, so the panel draws nothing; swiping one away hands the floor to the composer.
  const sheet = choiceSheet(approval)
  const confirm = confirmModal(approval)
  useEffect(() => {
    if (sheet) {
      showChoiceModal({
        title: sheet.title,
        message: sheet.message,
        items: sheet.items.map((i) => ({ label: i.label, destructive: i.destructive, onPress: () => onAnswer(i.label, i.index) })),
        onDismiss: onSay,
      })
    } else if (confirm) {
      showChoiceModal({ title: confirm.title, message: confirm.message, confirm: { label: confirm.confirm, onPress: () => onAnswer(confirm.confirm, 0) }, onDismiss: onSay })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- opened once per card (the panel is keyed by the card id)
  }, [])

  const toggle = (si: number, i: number, multi?: boolean) =>
    setSel((all) => all.map((cur, k) => (k !== si ? cur : multi ? (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]) : [i])))

  const section = (s: ApprovalSection, si: number) => {
    switch (s.kind) {
      case 'choices': {
        const rows = s.items.map((ch, i) => (
          <ChoiceRow
            key={`${si}-${i}`}
            choice={ch}
            on={sel[si]!.includes(i)}
            bare={!!s.multi && isStop(ch)}
            onPress={() => {
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
        const stop = sectioned && modal === 'none' ? approval.secondary : undefined
        if (s.multi) {
          const stopRow = stop ? <ChoiceRow choice={{ label: stop }} on={false} bare center onPress={cancel} /> : null
          const inGrid = s.options.length % 2 === 1
          return (
            <View key={si} style={{ gap: PANEL_GAP }}>
              {title ? <Question label={title} /> : null}
              <MultiGrid stop={stopRow && !inGrid ? <View style={{ marginTop: 2 }}>{stopRow}</View> : undefined}>
                {s.options.map((o, i) => (
                  <ChoiceRow key={o} choice={{ label: o }} on={sel[si]!.includes(i)} center onPress={() => toggle(si, i, true)} />
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
                {/* ChatPh0Input: a link row has no icon (owner rule 3, no needless icons); its text starts at the row's left edge. */}
                {r.tag === 'link' ? null : r.tag.length === 1 ? (
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
                {r.action === 'change' ? <MiniChip label="변경" onPress={() => setPicking(true)} /> : null}
              </View>
            ))}
          </View>
        )
      case 'templates':
        return (
          <View key={si} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingTop: 6, paddingBottom: spacing[1] }}>
            {s.items.map((t, i) => (
              <TemplateChip key={t.label} label={t.label} recommended={t.recommended} on={sel[si]!.includes(i)} onPress={() => toggle(si, i)} />
            ))}
          </View>
        )
      case 'toggle':
        return s.items.map((ch, i) => <ChoiceRow key={`${si}-${i}`} choice={ch} on={sel[si]!.includes(i)} tall={approval.sections.some((x) => x.kind === 'templates')} onPress={() => toggle(si, i, true)} />)
    }
  }

  const body = (
    <View style={{ gap: PANEL_GAP, paddingTop: ios ? 22 : spacing[5], paddingHorizontal: ios ? 14 : spacing[4], paddingBottom: ios ? 18 : insets.bottom + spacing[3] }}>
      <Text v="h3" accessibilityRole="header" style={{ fontSize: 18, lineHeight: 26, paddingHorizontal: spacing[1], paddingBottom: spacing[2] }}>
        {approval.question}
      </Text>
      {approval.detail ? (
        <Text v="c1" color="t3" style={{ paddingHorizontal: spacing[1], paddingBottom: 6, marginTop: -PANEL_GAP }}>
          {approval.detail}
        </Text>
      ) : null}
      {approval.sections.map(section)}
      {sectioned ? (
        <View style={{ gap: PANEL_GAP, marginTop: spacing[1] }}>
          {sectionSubmit ? <Button label={sectionSubmit} onPress={() => sendSections(sel)} /> : null}
          {approval.secondary && modal === 'none' && !approval.sections.some((s) => s.kind === 'chips') ? <Button variant="secondary" label={approval.secondary} onPress={cancel} /> : null}
        </View>
      ) : approval.submit ? (
        <>
          {multi.at >= 0 && approval.foot ? (
            <Text v="c2" color="t3" style={{ textAlign: 'center', paddingTop: FOOT_TOP, marginTop: 2 }}>
              {approval.foot}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: multi.at >= 0 ? spacing[1] : approval.sections.length ? 2 : 0, paddingHorizontal: multi.at >= 0 ? 0 : spacing[1] }}>
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
      {approval.warning ? (
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
  const motion = landed || reduce ? { opacity: 1, transform: [{ translateY: 0 }] } : { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }

  if (sheet || confirm) return null

  if (modal !== 'none')
    return (
      <ApprovalModal kind={modal} onClose={onSay} own={picking}>
        {picking ? renderPicker(() => setPicking(false)) : body}
      </ApprovalModal>
    )

  return (
    <Animated.View
      accessibilityViewIsModal
      accessibilityLabel="확인 요청"
      style={[
        ios
          ? // `.ios .panel`: the 1px ring is a spread shadow (`0 0 0 1px line`), not a border, so it adds nothing to the panel's height (ChatApprove: 136, a border made it 138).
            { marginHorizontal: spacing[2], marginBottom: spacing[2], backgroundColor: c.bg, borderRadius: 40, boxShadow: `${cssShadow.iosPanel}, 0 0 0 1px ${c.line}` }
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

/** `tall`: the row is `.ch.two` (64 high, top aligned) although it has no description (ChatPh4Design's 프로필 사진 넣기). */
const ChoiceRow = ({ choice, on, bare, center, tall, onPress }: { choice: Choice; on: boolean; bare?: boolean; center?: boolean; tall?: boolean; onPress: () => void }) => {
  const c = useColors()
  const ring = selectedRing(c)
  const two = !!choice.desc || !!tall
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={choice.label}
      onPress={onPress}
      style={({ pressed }) => ({
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
            borderRadius: 7,
            marginTop: two ? 1 : 0,
            backgroundColor: on ? c.ac : c.fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {on ? <Icon name="check" size={14} color={onAccent} /> : null}
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

/** A template is a word, not a drawing (ChatPh4Design `.tpo`): 40 high, 15 regular, the recommended one carries a 13 "· 추천". */
const TemplateChip = ({ label, recommended, on, onPress }: { label: string; recommended?: boolean; on: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={recommended ? `${label}, 추천` : label}
      onPress={onPress}
      hitSlop={hitSlopTo(40)}
      style={{ height: 40, paddingHorizontal: spacing[4], borderRadius: radius.lg, justifyContent: 'center', backgroundColor: on ? c.t1 : c.fill }}
    >
      <Text v="b2" style={{ color: on ? c.bg : c.t1 }}>
        {label}
        {recommended ? <Text v="c1" style={{ opacity: on ? 0.7 : 1, color: on ? c.bg : c.t3 }}>{` · 추천`}</Text> : null}
      </Text>
    </Pressable>
  )
}

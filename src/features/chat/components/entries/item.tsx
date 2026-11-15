import { memo, useEffect, useState } from 'react'
import { Animated, Easing, Platform, Pressable, View, useWindowDimensions } from 'react-native'
import BotText, { Bubble, PlanBlock } from './bot'
import Detail from './detail'
import { Dot } from './glyph'
import Rich from './rich'
import Notice from './notice'
import ReadOff, { type ReadOffAction } from './read-off'
import UserBubble, { useBubbleMax } from './user'
import { radius, spacing, useColors, useShadow, type Colors } from '../../../../theme'
import { Badge, Button, Icon, Text, useReduceMotion } from '@/shared/components'
import Blur from '@/shared/components/blur'
import { shareMessage } from '@/shared/infrastructure'
import { paymentsOpen } from '@/features/billing'
import { useChatAccount, useOpenArtifact, useShareFile } from '../../api/hooks'
import { usePop, usePulse } from '../../hooks'
import { diffBubble, fitBubble, todoLines, type DetailText } from '../../utils/bubble-detail'
import { isUsageExhausted, planRequired } from '../../utils/usage'
import { profileSaveCopy, resultChrome, resultMeta, resultTitle } from '../../utils/result-card'
import { LOCKED_KEYWORDS, fitChrome } from '../../utils/fit-card'
import { FIT_LOCKED, FIT_LOCKED_PCT, KEYWORD_GLYPH, fitProjected } from '../../constants'
import { Appear } from '../motion'
import Mark from '../mark'
import type { ChatItem, ToolState } from '../../types'


type Of<K extends ChatItem['type']> = Extract<ChatItem, { type: K }>

const dotColor = (c: Colors, s: ToolState) => ({ run: c.t3, ok: c.green, err: c.red, wait: c.orange })[s]

/** ⎿ elbow before a result line. */
const Elbow = () => {
  const c = useColors()
  return <View style={{ width: 10, height: 10, marginTop: 2, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: c.deco, borderBottomLeftRadius: 3 }} />
}

export const ToolLine = ({ item }: { item: Of<'tool'> }) => {
  const c = useColors()
  const [open, setOpen] = useState(false)
  const pop = usePop(item.state === 'ok')
  const extra = item.extra ?? []
  const result = [item.warning, item.result].filter(Boolean).join(' · ')
  return (
    <Appear style={{ gap: spacing[1] }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Dot color={item.warning && item.state === 'ok' ? c.orange : dotColor(c, item.state)} top={7} />
        </Animated.View>
        <Text v="b2" style={{ flex: 1 }}>
          <Text v="b2" weight="700">
            {item.action}
          </Text>
          {item.target ? (
            <Text v="b2" color="t3" weight="500">
              {' '}
              {item.target}
            </Text>
          ) : null}
        </Text>
      </View>
      {item.error ? (
        <Appear kind="fade" style={{ flexDirection: 'row', gap: spacing[2], paddingLeft: spacing[1] }}>
          <Elbow />
          <Text v="c1" weight="600" color="red" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
            {item.error}
          </Text>
        </Appear>
      ) : result ? (
        <Appear kind="fade" key={item.state} style={{ flexDirection: 'row', gap: spacing[2], paddingLeft: spacing[1] }}>
          <Elbow />
          <View style={{ flex: 1, gap: 2 }}>
            <Text v="c1" color="t2" style={{ fontSize: 14, lineHeight: 20 }}>
              <Rich v="c1" color="t2" style={{ fontSize: 14, lineHeight: 20 }} text={result} />
              {extra.length && !open ? (
                <Text
                  v="c1"
                  color="t3"
                  weight="600"
                  style={{ fontSize: 14 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${extra.length}줄 더 보기`}
                  onPress={() => setOpen(true)}
                  suppressHighlighting
                >
                  {`  +${extra.length}줄`}
                </Text>
              ) : null}
            </Text>
            {open ? (
              <Appear kind="fade">
                <Pressable accessibilityRole="button" accessibilityLabel="접기" onPress={() => setOpen(false)}>
                  <Text v="c1" color="t2" style={{ fontSize: 14, lineHeight: 20 }}>
                    {extra.join('\n')}
                  </Text>
                </Pressable>
              </Appear>
            ) : null}
          </View>
        </Appear>
      ) : null}
    </Appear>
  )
}

// shortcut: Android does not draw the decoration on a label that turns done (probed: native-driver pop off strikes one of two rows, constant weight none), so it draws the board's rule itself: 1.5pt at 55% of each line box. Retry the native line on an RN upgrade.
const StruckLabel = ({ on, ...props }: { on: boolean } & React.ComponentProps<typeof Text>) => {
  const c = useColors()
  const [lines, setLines] = useState<{ x: number; y: number; width: number; height: number }[]>([])
  if (Platform.OS === 'ios') return <Text {...props} style={[props.style, on ? { textDecorationLine: 'line-through' } : null]} />
  return (
    <View>
      <Text {...props} onTextLayout={(e) => setLines(e.nativeEvent.lines)} />
      {on
        ? lines.map((l, i) => (
            <View key={i} pointerEvents="none" style={{ position: 'absolute', left: l.x, top: l.y + l.height * 0.55 - 0.75, width: l.width, height: 1.5, backgroundColor: c.t3 }} />
          ))
        : null}
    </View>
  )
}

const TodoList = ({ item }: { item: Of<'todo'> }) => (
  <Bubble gap={spacing[1]}>
    {todoLines(item).map((line) => (
      <StruckLabel key={line.text} on={line.state === 'done'} v="b1" color={line.state === 'done' ? 't3' : 't1'} weight={line.state === 'now' ? '700' : '400'}>
        {line.text}
      </StruckLabel>
    ))}
  </Bubble>
)

const StaleGate = ({ item }: { item: Of<'stale'> }) => (
  <Bubble>
    <Rich v="b1" text={item.text} markId={item.id} />
  </Bubble>
)

const Plan = ({ item }: { item: Of<'plan'> }) => (
  <Bubble wide>
    <PlanBlock item={item} />
  </Bubble>
)

const BubbleDetailText = ({ id, view }: { id: string; view: DetailText }) => (
  <Bubble>
    <Rich v="b1" text={view.text} markId={id} />
    {view.detail ? <Detail text={view.detail.text} more={view.detail.more} /> : null}
  </Bubble>
)

/** Bar that grows from the left (900ms) to `pct`. */
const Bar = ({ pct, low, height = 8, delay = 150 }: { pct: number; low?: boolean; height?: number; delay?: number }) => {
  const c = useColors()
  const reduce = useReduceMotion()
  const v = useState(() => new Animated.Value(reduce ? 1 : 0))[0]
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: reduce ? 0 : 900, delay, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: false }).start()
  }, [v, reduce, delay])
  return (
    <View style={{ flex: 1, height, borderRadius: height / 2, backgroundColor: c.fill2, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: low ? c.orange : c.ac,
          width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.min(100, pct)}%`] }),
        }}
      />
    </View>
  )
}

const FitRow = ({ label, score, index }: { label: string; score: number; index: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <Text v="c1" color="t2" style={{ width: 76 }}>
      {label}
    </Text>
    <Bar pct={score * 10} low={score < 6} delay={150 + index * 80} />
    <Text v="c1" weight="700" style={{ width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
      {score.toFixed(1)}
    </Text>
  </View>
)

const LockedParts = ({ rows, onPlan }: { rows: { label: string }[]; onPlan?: () => void }) => {
  const c = useColors()
  const shadow = useShadow().pop
  return (
    <View>
      <View style={{ gap: spacing[3], opacity: 0.55, ...(Platform.OS === 'android' ? { filter: [{ blur: 5 }] } : {}) }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {rows.map((r, i) => (
          <FitRow key={r.label} label={r.label} score={FIT_LOCKED_PCT[i % FIT_LOCKED_PCT.length]! / 10} index={i} />
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1], paddingTop: spacing[1] }}>
          {LOCKED_KEYWORDS.map((k) => (
            <Badge key={k.label} label={k.label} glyph={KEYWORD_GLYPH[k.ok ? 'ok' : 'miss']} tone={k.ok ? 'green' : 'orange'} />
          ))}
        </View>
      </View>
      <Blur intensity={20} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[2] }}>
        <Pressable
          accessibilityRole={onPlan ? 'button' : 'text'}
          disabled={!onPlan}
          onPress={onPlan}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: radius.pill, backgroundColor: c.bg, elevation: 3, ...shadow }}
        >
          <Icon name="lock" size={14} color="t1" />
          <Text v="c1" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'center' }}>
            {FIT_LOCKED}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

// ChatPh1FitUltraOpen's thread box is 2 short of its content and cuts this card at 142 (16 padding would draw 144), so the open card takes 15.
const Projected = ({ label, bullets, open, onToggle }: { label: string; bullets: string[]; open: boolean; onToggle: () => void }) => {
  const c = useColors()
  return (
    <Appear style={{ gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: open ? 15 : 11, borderRadius: radius.card, backgroundColor: c.bg2 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Text v="b2" weight="700" style={{ flex: 1 }}>
          {fitProjected(label)}
        </Text>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="chev" size={16} color="t3" />
        </View>
      </Pressable>
      {open
        ? bullets.map((b) => (
            <Text key={b} v="b2" color="t2">
              • {b}
            </Text>
          ))
        : null}
    </Appear>
  )
}

// iOS draws the 40pt numeral ~6pt higher in its 44pt line box than the board (card top to numeral 15.6 vs 21, '/ 10' 8pt low); the shift grows with the text size.
const FIT_DROP = 6
// The board's score row under .ph's tracking: the numbers keep the page's -0.32px instead of an em scale, and the 22pt number's normal line sits 2pt lower than the 44pt line (row 45.9).
const NOTE_TRACKING = -0.32
const NOTE_ROW_LEAD = 2

const useFitDrop = () => {
  const { fontScale } = useWindowDimensions()
  return Platform.OS === 'ios' ? Math.round(FIT_DROP * fontScale) : 0
}

const FitNum = ({ size, color, children, rowDrop }: { size: 'mid' | 'big'; color: keyof Colors; children: string; rowDrop?: boolean }) => {
  const drop = useFitDrop()
  return (
    <Text
      v={size === 'big' ? 'h1' : 'h2'}
      weight="800"
      color={color}
      style={size === 'big' ? { fontSize: 40, lineHeight: 44, letterSpacing: rowDrop ? NOTE_TRACKING : -1.2, fontVariant: ['tabular-nums'], transform: [{ translateY: rowDrop ? 0 : drop }] } : { fontSize: 22, fontVariant: ['tabular-nums'], ...(rowDrop ? { letterSpacing: NOTE_TRACKING } : null) }}
    >
      {children}
    </Text>
  )
}

const FitCard = ({ item, onPlan: planEntry }: { item: Of<'fit'>; onPlan?: () => void }) => {
  const c = useColors()
  // No upgrade entry while payments are closed or the account has not loaded.
  const open = paymentsOpen(useChatAccount(true).data)
  const onPlan = open ? planEntry : undefined
  const view = fitChrome(item, open)
  // ChatPh1FitUltra (closed) draws the card at gap 8 and 12 under; ChatPh1FitUltraOpen draws it at the standard gap 10, 16 between its rows and 16 under, so the card follows the teaser's state.
  const [projectedOpen, setProjectedOpen] = useState(false)
  const opened = !!view.projected && projectedOpen
  const basic = !view.locked && !item.note && !view.projected
  const compact = !view.locked && !item.note && item.from === undefined && !opened
  const drop = useFitDrop()
  const head = item.note ? (
    // 점수 올리기: before → after, one bar, the note. The row drops as one so the baselines stay shared.
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2], paddingBottom: NOTE_ROW_LEAD, transform: [{ translateY: drop }] }}>
      {item.from !== undefined ? (
        <>
          <FitNum size="mid" color="t3" rowDrop>{item.from.toFixed(1)}</FitNum>
          <Text color="t3">→</Text>
        </>
      ) : null}
      <FitNum size="big" color="t1" rowDrop>{item.score.toFixed(1)}</FitNum>
    </View>
  ) : item.from !== undefined ? (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] }}>
      <Text v="c1" weight="700" color="t3">
        적합도
      </Text>
      <FitNum size="mid" color="t3">{item.from.toFixed(1)}</FitNum>
      <Text color="t3">→</Text>
      <FitNum size="mid" color="t1">{item.score.toFixed(1)}</FitNum>
      <View style={{ flex: 1 }} />
      {item.delta ? <Badge label={item.delta} tone="green" /> : null}
    </View>
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[3] }}>
      <FitNum size="big" color="t1">{item.score.toFixed(1)}</FitNum>
      <Text v="b2" color="t3" style={{ paddingBottom: spacing[2] }}>
        / 10
      </Text>
      {item.caption ? (
        <Text v="c1" color="t3" style={{ flex: 1, textAlign: 'right', paddingBottom: spacing[1] }}>
          {item.caption}
        </Text>
      ) : null}
    </View>
  )
  return (
    <View style={{ gap: opened ? spacing[4] : spacing[3] }}>
      {basic ? (
        <BubbleDetailText id={item.id} view={fitBubble(item)} />
      ) : (
        <Appear style={compact ? { gap: spacing[2], padding: spacing[4], paddingBottom: spacing[3], borderRadius: radius.card, backgroundColor: c.bg2 } : { gap: 10, padding: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}>
          {head}
          {view.locked ? (
            <LockedParts rows={item.rows ?? []} onPlan={onPlan} />
          ) : (
            <>
              {item.rows?.map((r, i) => (
                <FitRow key={r.label} label={r.label} score={r.score} index={i} />
              ))}
              {item.keywords ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1], paddingTop: spacing[1] }}>
                  {item.keywords.map((k) => (
                    <Badge key={k.label} label={k.label} glyph={KEYWORD_GLYPH[k.ok ? 'ok' : 'miss']} tone={k.ok ? 'green' : 'orange'} />
                  ))}
                </View>
              ) : null}
            </>
          )}
          {item.note ? (
            <>
              <Bar pct={item.score * 10} height={10} />
              <Text v="c1" color="t3">
                {item.note}
              </Text>
            </>
          ) : null}
        </Appear>
      )}
      {view.summary ? <BotText item={{ type: 'agentText', id: `${item.id}-summary`, text: view.summary }} /> : null}
      {view.teaser ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPlan}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], height: 44, paddingHorizontal: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}
        >
          <Icon name="lock" size={16} color="t3" />
          <Text v="b2" weight="600" color="t2">
            {view.teaser}
          </Text>
        </Pressable>
      ) : null}
      {view.projected ? <Projected label={view.projected.label} bullets={view.projected.bullets} open={projectedOpen} onToggle={() => setProjectedOpen((v) => !v)} /> : null}
    </View>
  )
}

/** A file or result the bot made sits in a bubble of its own, the bot's bubble colour and corners (rule 30). */
const Surface = ({ children }: { children: React.ReactNode }) => {
  const c = useColors()
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: 14, borderRadius: radius.lg, borderBottomLeftRadius: radius.xs, backgroundColor: c.fill }}
    >
      {children}
    </View>
  )
}

/** A plain icon: sub buttons inside the chat are not glass (ChatDone). */
const ShareButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel="공유" onPress={onPress} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
    <Icon name="share" size={20} color="t2" />
  </Pressable>
)

const FileCard = ({ item }: { item: Of<'file'> }) => {
  const c = useColors()
  const open = useOpenArtifact()
  const share = () => (item.url ? open.mutate({ url: item.url, name: item.name }) : void shareMessage({ message: item.name, title: item.name }))
  const done = item.progress === undefined || item.progress >= 1
  return (
    <Appear>
      <Surface>
        <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
          <Text v="b2" weight="700" numberOfLines={1}>
            {item.name}
          </Text>
          {!done ? (
            <View style={{ height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: 'hidden' }}>
              <View style={{ width: `${(item.progress ?? 0) * 100}%`, height: '100%', backgroundColor: c.ac }} />
            </View>
          ) : item.meta ? (
            <Text v="c1" color="t3">
              {item.meta}
            </Text>
          ) : null}
        </View>
        {item.preview ? <Button label="미리보기" variant="secondary" size="sm" onPress={share} /> : null}
        {done ? <ShareButton onPress={share} /> : null}
      </Surface>
    </Appear>
  )
}

const ResultCard = ({ item, onView }: { item: Of<'result'>; onView: () => void }) => {
  const chrome = resultChrome(item)
  const share = useShareFile()
  const save = profileSaveCopy(item)
  const title = save?.title ?? resultTitle(item)
  const body = (
    <Surface>
      {chrome.initials && chrome.color ? <Mark text={chrome.initials} color={chrome.color} size={40} round /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b2" weight="700" numberOfLines={1}>
          {title}
        </Text>
        <Text v="c1" color="t3">
          {save?.body ?? resultMeta(item)}
        </Text>
      </View>
      {save ? <Button label={save.buttons[0]} variant="secondary" size="sm" onPress={onView} /> : null}
      {chrome.share ? <ShareButton onPress={() => share.mutate({ documentId: item.documentId, name: item.source === 'external' ? item.fileName : undefined })} /> : null}
    </Surface>
  )
  // The chat holds no action buttons (ChatDoneNext); the profile card itself opens the profile.
  return (
    <Appear>
      {item.source === 'profile' && !save ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${title} 열기`} onPress={onView}>
          {body}
        </Pressable>
      ) : (
        body
      )}
    </Appear>
  )
}

const Paper = ({ item }: { item: Of<'paper'> }) => {
  const c = useColors()
  const caret = usePulse(true, 1000, 0)
  const [first, ...rest] = item.lines
  return (
    <Appear style={{ borderRadius: radius.card, padding: spacing[4], gap: 6, backgroundColor: c.paper, borderWidth: 1, borderColor: c.line }}>
      <Text v="c2" weight="700" color="t3">
        {item.label}
      </Text>
      <Text v="h3">{item.heading}</Text>
      {first ? (
        <Text v="c1" weight="700" style={{ marginTop: spacing[1] }}>
          {first}
        </Text>
      ) : null}
      {rest.map((l, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text v="c1" color="t2" style={{ flexShrink: 1 }}>
            {l}
          </Text>
          {i === rest.length - 1 ? <Animated.View style={{ width: 2, height: 15, marginLeft: 1, marginBottom: 2, backgroundColor: c.ac, opacity: caret }} /> : null}
        </View>
      ))}
      <View style={{ height: 7, width: '78%', marginTop: spacing[1], borderRadius: spacing[1], backgroundColor: c.fill2 }} />
      <View style={{ height: 7, width: '60%', borderRadius: spacing[1], backgroundColor: c.fill2 }} />
    </Appear>
  )
}

/** Renders one transcript item. Completion actions get callbacks from the screen. */
const ItemComponent = ({
  item,
  onUsage,
  onView,
  onReadOff,
}: {
  item: ChatItem
  onUsage?: (action: 'plan' | 'credits') => void
  onView?: (item: Of<'result'>) => void
  onReadOff?: (action: ReadOffAction) => void
}) => {
  switch (item.type) {
    case 'user':
      return <UserBubble item={item} />
    case 'agentText':
      return <BotText item={item} />
    case 'notice':
      return <Notice id={item.id} notice={item.notice} />
    case 'readOff':
      return <ReadOff item={item} onAction={onReadOff} />
    case 'tool':
      // Tool lines are not drawn, except a failed step that says why: the red line of ChatErrors ("자격 요건"을 읽지 못했어요 · …).
      return item.state === 'err' && item.error ? <ErrorLine id={item.id} text={item.error} /> : null
    case 'think':
      return null
    case 'todo':
      return <TodoList item={item} />
    case 'stale':
      return <StaleGate item={item} />
    case 'plan':
      return <Plan item={item} />
    case 'diff':
      return <BubbleDetailText id={item.id} view={diffBubble(item)} />
    case 'fit':
      return <FitCard item={item} onPlan={onUsage ? () => onUsage('plan') : undefined} />
    case 'file':
      return <FileCard item={item} />
    case 'paper':
      return <Paper item={item} />
    case 'result':
      return <ResultCard item={item} onView={() => onView?.(item)} />
    case 'worked':
      return null
    case 'error':
      // The credit banner above the composer says it; the refused turn leaves no line of its own.
      return isUsageExhausted(item.code) ? null : item.code === 'PLAN_REQUIRED' ? (
        <PlanRequired id={item.id} />
      ) : item.reason ? (
        <Notice id={item.id} notice={{ kind: 'error', code: item.code, reason: item.reason }} />
      ) : (
        <ErrorLine id={item.id} text={item.text} />
      )
  }
}

export const Item = memo(ItemComponent)

// ChatErrUnavailable: an error is a bubble, not a status line (rule 29).
const ErrorLine = ({ id, text }: { id: string; text: string }) => <Notice id={id} notice={{ kind: 'failed', text }} />

// Read at render: payments can close or the account can load after the error arrived.
const PlanRequired = ({ id }: { id: string }) => {
  const account = useChatAccount(true).data
  return <ErrorLine id={id} text={planRequired(account?.plan, paymentsOpen(account))} />
}

/** Grey clock chip for messages sent while the agent works: the icon says it waits, no label (ChatStates.3, rule 29). */
export const Queued = ({ text }: { text: string }) => {
  const c = useColors()
  const maxWidth = useBubbleMax(27)
  return (
    <Appear
      kind="bubble"
      style={{ alignSelf: 'flex-end', maxWidth, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: 14, backgroundColor: c.fill }}
    >
      <Icon name="clock" size={16} color="t2" />
      <Text v="c1" color="t2" style={{ fontSize: 14, lineHeight: 20, flexShrink: 1 }}>
        {text}
      </Text>
    </Appear>
  )
}

export { default as Rich } from './rich'

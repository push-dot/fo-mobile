import { useEffect, useState } from 'react'
import { Animated, Easing, Platform, Pressable, View, useWindowDimensions } from 'react-native'
import { onAccent, radius, spacing, tile, useColors, useShadow, type Colors } from '../../../theme'
import { Badge, Button, Icon, Text } from '@/shared/components'
import Blur from '@/shared/components/blur'
import { shareMessage } from '@/shared/infrastructure'
import { useOpenArtifact, useShareFile } from '../api/hooks'
import { usePop, usePulse, useReduceMotion } from '../hooks'
import { isUsageExhausted } from '../utils/usage'
import { formatElapsed } from '../utils/reducer'
import { isVerdictPlan } from '../utils/stream-v3'
import { RESULT_VARIANT, applyText, profileSaveCopy, resultActionsFor, resultChrome, resultMeta, resultTitle, type ResultActionId } from '../utils/result-card'
import { LOCKED_KEYWORDS, fitChrome } from '../utils/fit-card'
import { FIT_LOCKED, FIT_LOCKED_PCT, STALE_GATE, fitProjected } from '../constants'
import { Appear } from './motion'
import Mark from './mark'
import { UsageExhausted } from './usage-exhausted'
import type { ChatItem, ToolState } from '../types'


type Of<K extends ChatItem['type']> = Extract<ChatItem, { type: K }>

/** Renders **bold** spans inside a Text. */
export const Rich = ({ text, ...rest }: { text: string } & React.ComponentProps<typeof Text>) => {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <Text {...rest}>
      {parts.map((p, i) =>
        i % 2 ? (
          <Text key={i} {...rest} weight="700">
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  )
}

const Dot = ({ color, size = 8, top = 8 }: { color: string; size?: number; top?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginTop: top }} />
)

// The design's max-width: 82% sizes the content box, so the bubble's padding and border come on top of it.
const useBubbleMax = (chrome: number) => (useWindowDimensions().width - spacing[5] * 2) * 0.82 + chrome

const UserBubble = ({ item }: { item: Of<'user'> }) => {
  const c = useColors()
  const maxWidth = useBubbleMax(30)
  return (
    <Appear kind="bubble" style={{ alignSelf: 'flex-end', maxWidth }}>
      <View style={{ paddingVertical: 11, paddingHorizontal: 15, borderRadius: radius.lg, borderBottomRightRadius: radius.xs, backgroundColor: c.fill }}>
        <Text v="b1" style={{ lineHeight: 23 }}>
          {item.text}
        </Text>
        {item.attachment ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing[2], paddingVertical: spacing[2], paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: c.bg }}>
            <Icon name="paper" size={16} color="t2" />
            <Text v="c1" weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>
              {item.attachment}
            </Text>
          </View>
        ) : null}
      </View>
    </Appear>
  )
}

const AUTO_PICK = /^자동으로 골랐어요/

const AgentText = ({ item }: { item: Of<'agentText'> }) => {
  const c = useColors()
  if (AUTO_PICK.test(item.text))
    return (
      <Appear style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Glyph still size={14} color={c.acText} />
        <Text v="c1" color="t3">
          {item.text}
        </Text>
      </Appear>
    )
  return (
    <Appear style={{ flexDirection: 'row', gap: 10 }}>
      <Dot color={c.ac} />
      <View style={{ flex: 1, gap: 6 }}>
        <Rich v="b1" text={item.text} />
        {item.bullets?.length ? (
          <Text v="b2" color="t2">
            {item.bullets.map((b) => `• ${b}`).join('\n')}
          </Text>
        ) : null}
      </View>
    </Appear>
  )
}

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

const TodoRow = ({ item }: { item: Of<'todo'>['items'][number] }) => {
  const c = useColors()
  const done = item.state === 'done'
  const now = item.state === 'now'
  const pop = usePop(done)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Animated.View
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          borderWidth: now ? 2 : 1.5,
          borderColor: done ? c.t3 : now ? c.ac : c.deco,
          backgroundColor: done ? c.t3 : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: pop }],
        }}
      >
        {done ? <Icon name="check" size={12} color={onAccent} /> : null}
        {now ? <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: c.ac }} /> : null}
      </Animated.View>
      <Text v="b2" color={done ? 't3' : 't1'} weight={now ? '700' : '400'} style={done ? { textDecorationLine: 'line-through' } : undefined}>
        {item.label}
      </Text>
      {item.added ? <Badge label="새로 추가" tone="ac" /> : null}
    </View>
  )
}

const Card = ({ children, gap = 7, padding }: { children: React.ReactNode; gap?: number; padding?: number }) => {
  const c = useColors()
  return (
    <Appear style={{ gap, ...(padding === undefined ? { paddingVertical: 14, paddingHorizontal: spacing[4] } : { padding }), borderRadius: radius.card, backgroundColor: c.bg2 }}>
      {children}
    </Appear>
  )
}

const TodoList = ({ item }: { item: Of<'todo'> }) => {
  const done = item.items.filter((i) => i.state === 'done').length
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text v="c1" weight="700" color="t3">
          {item.title ?? '할 일'}
        </Text>
        <Text v="c1" weight="700" color="t3" style={{ fontVariant: ['tabular-nums'] }}>
          {done}/{item.items.length}
        </Text>
      </View>
      {item.items.map((i) => (
        <TodoRow key={i.label} item={i} />
      ))}
    </Card>
  )
}

const StaleGate = ({ item }: { item: Of<'stale'> }) => (
  <Card gap={8}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text v="c1" weight="700" color="t3">
        {STALE_GATE.title}
      </Text>
      <Badge label={STALE_GATE.badge} />
    </View>
    <Text v="b2" weight="600" color="t2">
      {item.text}
    </Text>
  </Card>
)

const Plan = ({ item }: { item: Of<'plan'> }) => {
  const titled = !!item.title
  const verdict = isVerdictPlan(item.rows)
  const card = (
    <Card gap={titled ? spacing[3] : 14} padding={spacing[4]}>
      {titled ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text v="c1" weight="700" color="t3">
            {item.title}
          </Text>
          <Text v="c1" weight="700" color="t3">
            {item.meta}
          </Text>
        </View>
      ) : null}
      {item.rows.map((r, i) => (
        <View key={r.label} style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' }}>
          {verdict ? <Badge label={String(i + 1)} minWidth={24} /> : <Badge label={r.tag} tone={r.tone} minWidth={titled ? 52 : 58} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text v="b2" weight="700">
              {r.label}
            </Text>
            <Text v="c1" color="t3">
              {r.note}
            </Text>
          </View>
          {verdict ? <Badge label={r.tag} tone={r.tone} /> : null}
        </View>
      ))}
      {titled && item.keywords.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {item.keywords.map((k) => (
            <Badge key={k} label={`+ ${k}`} tone="ac" />
          ))}
        </View>
      ) : null}
    </Card>
  )
  return titled ? card : <View style={{ paddingLeft: 18, marginTop: -spacing[2] }}>{card}</View>
}

const Diff = ({ item }: { item: Of<'diff'> }) => {
  const c = useColors()
  return (
    <View style={{ borderRadius: radius.card, overflow: 'hidden', backgroundColor: c.bg2 }}>
      {item.lines.map((l, i) => {
        const add = l.sign === '+'
        const del = l.sign === '-'
        return (
          // Lines land one by one: 300ms each, 150ms apart.
          <Appear
            key={i}
            kind="fade"
            delay={i * 150}
            duration={300}
            style={{ flexDirection: 'row', gap: 10, paddingVertical: 5, paddingHorizontal: spacing[3], backgroundColor: add ? c.greenSoft : del ? c.redSoft : 'transparent' }}
          >
            <Text v="c2" color="t3" style={{ width: spacing[4], textAlign: 'right', lineHeight: 20, fontVariant: ['tabular-nums'] }}>
              {l.n ?? ''}
            </Text>
            <Text v="c1" weight="700" style={{ width: 10, lineHeight: 20, color: add ? c.green : del ? c.red : c.t3 }}>
              {l.sign === '-' ? '−' : l.sign}
            </Text>
            <Text
              v="c1"
              color={del ? 't2' : 't1'}
              style={[{ flex: 1, lineHeight: 20 }, del ? { textDecorationLine: 'line-through', textDecorationColor: c.red } : null]}
            >
              {l.text}
            </Text>
          </Appear>
        )
      })}
    </View>
  )
}

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
            <Badge key={k.label} label={`${k.ok ? '✓' : '!'} ${k.label}`} tone={k.ok ? 'green' : 'orange'} />
          ))}
        </View>
      </View>
      <Blur intensity={20} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[2] }}>
        <Pressable
          accessibilityRole="button"
          onPress={onPlan}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: radius.pill, backgroundColor: c.bg, elevation: 3, ...shadow }}
        >
          <Icon name="lock" size={14} color="t1" />
          <Text v="c1" weight="700" style={{ flexShrink: 1, textAlign: 'center' }}>
            {FIT_LOCKED}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const Projected = ({ label, bullets }: { label: string; bullets: string[] }) => {
  const c = useColors()
  const [open, setOpen] = useState(false)
  return (
    <Appear style={{ gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: open ? spacing[4] : 11, borderRadius: radius.card, backgroundColor: c.bg2 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
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

const FitNum = ({ size, color, children }: { size: 'mid' | 'big'; color: keyof Colors; children: string }) => (
  <Text
    v={size === 'big' ? 'h1' : 'h2'}
    weight="800"
    color={color}
    style={size === 'big' ? { fontSize: 40, lineHeight: 44, letterSpacing: -1.2, fontVariant: ['tabular-nums'] } : { fontSize: 22, fontVariant: ['tabular-nums'] }}
  >
    {children}
  </Text>
)

const FitCard = ({ item, onPlan }: { item: Of<'fit'>; onPlan?: () => void }) => {
  const c = useColors()
  const view = fitChrome(item)
  const compact = !view.locked && !item.note && item.from === undefined
  const head = item.note ? (
    // 점수 올리기: before → after, one bar, the note.
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] }}>
      {item.from !== undefined ? (
        <>
          <FitNum size="mid" color="t3">{item.from.toFixed(1)}</FitNum>
          <Text color="t3">→</Text>
        </>
      ) : null}
      <FitNum size="big" color="acText">{item.score.toFixed(1)}</FitNum>
    </View>
  ) : item.from !== undefined ? (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] }}>
      <Text v="b2" weight="800" color="t3" style={{ lineHeight: 20 }}>
        적합도
      </Text>
      <FitNum size="mid" color="t3">{item.from.toFixed(1)}</FitNum>
      <Text color="t3">→</Text>
      <FitNum size="mid" color="acText">{item.score.toFixed(1)}</FitNum>
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
    <View style={{ gap: spacing[3] }}>
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
                  <Badge key={k.label} label={`${k.ok ? '✓' : '!'} ${k.label}`} tone={k.ok ? 'green' : 'orange'} />
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
      {view.summary ? <AgentText item={{ type: 'agentText', id: `${item.id}-summary`, text: view.summary }} /> : null}
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
      {view.projected ? <Projected label={view.projected.label} bullets={view.projected.bullets} /> : null}
    </View>
  )
}

const Surface = ({ children }: { children: React.ReactNode }) => {
  const c = useColors()
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: 14, borderRadius: radius.card },
        Platform.OS === 'ios' ? { backgroundColor: c.bg2 } : { borderWidth: 1, borderColor: c.line },
      ]}
    >
      {children}
    </View>
  )
}

const ShareButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel="공유" onPress={onPress} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
    <Icon name="share" size={22} color="t2" />
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

const ResultCard = ({
  item,
  onApply,
  onConvert,
  onView,
  convertPending,
  awaiting,
}: {
  item: Of<'result'>
  onApply: () => void
  onConvert: () => void
  onView: () => void
  convertPending?: boolean
  awaiting?: boolean
}) => {
  const chrome = resultChrome(item)
  const share = useShareFile()
  const save = profileSaveCopy(item)
  const title = save?.title ?? resultTitle(item)
  const press = (id: ResultActionId) => (id === 'apply' ? onApply() : id === 'convert' ? onConvert() : onView())
  const actions = resultActionsFor(item, awaiting)
  return (
    <Appear style={{ gap: 18 }}>
      <Surface>
        {chrome.initials ? <Mark text={chrome.initials} color={tile.indigo} size={40} round /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text v="b2" weight="700" numberOfLines={1}>
            {title}
          </Text>
          <Text v="c1" color="t3">
            {save?.body ?? resultMeta(item)}
          </Text>
        </View>
        {save ? <Button label={save.buttons[0]} variant={RESULT_VARIANT.view} size="sm" onPress={onView} /> : null}
        {chrome.share ? <ShareButton onPress={() => share.mutate({ documentId: item.documentId, name: item.source === 'external' ? item.fileName : undefined })} /> : null}
      </Surface>
      {actions.length ? (
        <View style={{ gap: spacing[2] }}>
          {actions.map((action) => (
            <Button
              key={action.id}
              label={action.label}
              variant={RESULT_VARIANT[action.id]}
              disabled={action.id === 'convert' && convertPending}
              onPress={() => press(action.id)}
            />
          ))}
        </View>
      ) : null}
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

export const Glyph = ({ still, size = 17, color }: { still?: boolean; size?: number; color?: string }) => {
  const c = useColors()
  const reduce = useReduceMotion()
  const frames = ['·', '✢', '✳', '✶', '✻', '✽']
  const [i, setI] = useState(4)
  useEffect(() => {
    if (still || reduce) return
    // 6 frames per 1.1s, stepped.
    const t = setInterval(() => setI((n) => (n + 1) % frames.length), 1100 / frames.length)
    return () => clearInterval(t)
  }, [still, reduce, frames.length])
  return (
    <Text style={{ width: size + 1, textAlign: 'center', fontSize: size, lineHeight: 20, color: color ?? c.ac }} accessibilityElementsHidden>
      {frames[still || reduce ? 4 : i]}
    </Text>
  )
}

/** Renders one transcript item. Completion actions get callbacks from the screen. */
export const Item = ({
  item,
  onAction,
  onUsage,
  onConvert,
  onView,
  resultPending,
  resultAwaiting,
}: {
  item: ChatItem
  onAction: (text: string) => void
  onUsage?: (action: 'plan' | 'credits') => void
  onConvert?: (item: Of<'result'>) => void
  onView?: (item: Of<'result'>) => void
  resultPending?: boolean
  resultAwaiting?: boolean
}) => {
  const c = useColors()
  switch (item.type) {
    case 'user':
      return <UserBubble item={item} />
    case 'agentText':
      return <AgentText item={item} />
    case 'think':
      return (
        <Appear style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="down" size={14} color="t3" />
          <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20 }}>
            생각함 · {item.seconds}초
          </Text>
        </Appear>
      )
    case 'tool':
      return <ToolLine item={item} />
    case 'todo':
      return <TodoList item={item} />
    case 'stale':
      return <StaleGate item={item} />
    case 'plan':
      return <Plan item={item} />
    case 'diff':
      return <Diff item={item} />
    case 'fit':
      return <FitCard item={item} onPlan={onUsage ? () => onUsage('plan') : undefined} />
    case 'file':
      return <FileCard item={item} />
    case 'paper':
      return <Paper item={item} />
    case 'result':
      return (
        <ResultCard
          item={item}
          onApply={() => onAction(applyText(item.company))}
          onConvert={() => onConvert?.(item)}
          onView={() => onView?.(item)}
          convertPending={resultPending}
          awaiting={resultAwaiting}
        />
      )
    case 'worked':
      return (
        <Appear kind="fade" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Glyph still size={14} color={c.t3} />
          <Text v="c1" color="t3">
            {formatElapsed(item.seconds)} 동안 작업했어요
          </Text>
        </Appear>
      )
    case 'error':
      return isUsageExhausted(item.code) && onUsage ? (
        <UsageExhausted onPlan={() => onUsage('plan')} onCredits={() => onUsage('credits')} />
      ) : (
        <Appear style={{ flexDirection: 'row', gap: spacing[2] }}>
          <Text v="c1" weight="800" color="red">
            !
          </Text>
          <Text v="c1" color="red" style={{ flex: 1 }}>
            {item.text}
          </Text>
        </Appear>
      )
  }
}

/** Dashed "대기 중" chip for messages sent while the agent works. */
export const Queued = ({ text }: { text: string }) => {
  const c = useColors()
  const maxWidth = useBubbleMax(27)
  return (
    <Appear
      kind="bubble"
      style={{ alignSelf: 'flex-end', maxWidth, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.deco }}
    >
      <Icon name="clock" size={14} color="t2" />
      <Text v="c1" color="t2" style={{ fontSize: 14, lineHeight: 20, flexShrink: 1 }}>
        대기 중 · {text}
      </Text>
    </Appear>
  )
}

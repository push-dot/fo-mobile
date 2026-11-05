import { useEffect, useState } from 'react'
import { Animated, Easing, Platform, Pressable, View } from 'react-native'
import { fontFor, useColors, type Colors } from '../../../theme'
import { Badge, Button, Glass, Icon, Text } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { useOpenArtifact } from '../api/hooks'
import { usePop, usePulse, useReduceMotion } from '../hooks'
import { isUsageExhausted } from '../utils/usage'
import { formatElapsed } from '../utils/reducer'
import { profileSaveCopy, resultActions, resultChrome, resultMeta, resultTask, resultTitle, type ResultActionId } from '../utils/result-card'
import { fitChrome } from '../utils/fit-card'
import { FIT_LOCKED, FIT_LOCKED_PCT, fitProjected } from '../constants'
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

const UserBubble = ({ item }: { item: Of<'user'> }) => {
  const c = useColors()
  return (
    <Appear kind="bubble" style={{ alignSelf: 'flex-end', maxWidth: '82%' }}>
      <View style={{ paddingVertical: 11, paddingHorizontal: 15, borderRadius: 20, borderBottomRightRadius: 6, backgroundColor: c.fill }}>
        <Text v="b1" style={{ lineHeight: 23 }}>
          {item.text}
        </Text>
        {item.attachment ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c.bg }}>
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

const AgentText = ({ item }: { item: Of<'agentText'> }) => {
  const c = useColors()
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
  const blink = usePulse(item.state === 'run')
  const pop = usePop(item.state === 'ok', 300)
  const shimmer = usePulse(item.state === 'run', 2000, 0.45)
  const extra = item.extra ?? []
  const result = [item.warning, item.result].filter(Boolean).join(' · ')
  return (
    <Appear style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Animated.View style={{ opacity: blink, transform: [{ scale: pop }] }}>
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
        <Appear kind="fade" style={{ paddingLeft: 4 }}>
          <Text v="c1" weight="600" color="red" style={{ fontSize: 14, lineHeight: 20 }}>
            {item.error}
          </Text>
        </Appear>
      ) : result ? (
        <Appear kind="fade" key={item.state} style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
          <Elbow />
          <View style={{ flex: 1, gap: 2 }}>
            <Animated.View style={{ opacity: shimmer }}>
              <Text v="c1" color={item.state === 'run' ? 't3' : 't2'} style={{ fontSize: 14, lineHeight: 20 }}>
                <Rich v="c1" color={item.state === 'run' ? 't3' : 't2'} style={{ fontSize: 14, lineHeight: 20 }} text={result} />
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
            </Animated.View>
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
  const blink = usePulse(now)
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
        {done ? <Icon name="check" size={12} color="#FFFFFF" /> : null}
        {now ? <Animated.View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: c.ac, opacity: blink }} /> : null}
      </Animated.View>
      <Text v="b2" color={done ? 't3' : 't1'} weight={now ? '700' : '400'} style={done ? { textDecorationLine: 'line-through' } : undefined}>
        {item.label}
      </Text>
      {item.added ? <Badge label="새로 추가" tone="ac" /> : null}
    </View>
  )
}

const Card = ({ children, gap = 7 }: { children: React.ReactNode; gap?: number }) => {
  const c = useColors()
  return <Appear style={{ gap, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: c.bg2 }}>{children}</Appear>
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

const Plan = ({ item }: { item: Of<'plan'> }) => {
  return (
    <Card gap={10}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text v="c1" weight="700" color="t3">
          {item.title}
        </Text>
        <Text v="c1" weight="700" color="t3">
          {item.meta}
        </Text>
      </View>
      {item.rows.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Badge label={r.tag} tone={r.tone} />
          <View style={{ flex: 1 }}>
            <Text v="b2" weight="700">
              {r.label}
            </Text>
            <Text v="c1" color="t3">
              {r.note}
            </Text>
          </View>
        </View>
      ))}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {item.keywords.map((k) => (
          <Badge key={k} label={`+ ${k}`} tone="ac" />
        ))}
      </View>
    </Card>
  )
}

const Diff = ({ item }: { item: Of<'diff'> }) => {
  const c = useColors()
  return (
    <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: c.bg2 }}>
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
            style={{ flexDirection: 'row', gap: 10, paddingVertical: 5, paddingHorizontal: 12, backgroundColor: add ? c.greenSoft : del ? c.redSoft : 'transparent' }}
          >
            <Text style={[{ width: 16, textAlign: 'right', color: c.t4, fontSize: 11, lineHeight: 20, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }]}>
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

const FitRow = ({ label, score, index }: { label: string; score?: number; index: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <Text v="c1" color="t2" style={{ width: 76 }}>
      {label}
    </Text>
    <Bar pct={score === undefined ? FIT_LOCKED_PCT[index % FIT_LOCKED_PCT.length]! : score * 10} low={score !== undefined && score < 6} delay={150 + index * 80} />
    <Text v="c1" weight="700" style={{ width: 28, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
      {score === undefined ? '' : score.toFixed(1)}
    </Text>
  </View>
)

/** FREE: the part rows sit under a lock pill; the real scores are never drawn. */
const LockedParts = ({ rows, onPlan }: { rows: { label: string }[]; onPlan?: () => void }) => {
  const c = useColors()
  return (
    <View>
      <View style={{ gap: 12, opacity: 0.35 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {rows.map((r, i) => (
          <FitRow key={r.label} label={r.label} index={i} />
        ))}
      </View>
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
        <Pressable
          accessibilityRole="button"
          onPress={onPlan}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.bg, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}
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
    <Appear style={{ gap: 8, paddingHorizontal: 16, paddingVertical: open ? 16 : 11, borderRadius: 20, backgroundColor: c.bg2 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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

const FitCard = ({ item, onPlan }: { item: Of<'fit'>; onPlan?: () => void }) => {
  const c = useColors()
  const view = fitChrome(item)
  const num = { ...fontFor('800'), fontVariant: ['tabular-nums' as const] }
  const big = { ...num, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 }
  const mid = { ...num, fontSize: 22, lineHeight: 28 }
  const head = item.note ? (
    // 점수 올리기: before → after, one bar, the note.
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
      {item.from !== undefined ? (
        <>
          <Text style={[mid, { color: c.t3 }]}>{item.from.toFixed(1)}</Text>
          <Text color="t3">→</Text>
        </>
      ) : null}
      <Text style={[big, { color: c.acText }]}>{item.score.toFixed(1)}</Text>
    </View>
  ) : item.from !== undefined ? (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
      <Text v="c1" weight="700" color="t3">
        적합도
      </Text>
      <Text style={[mid, { color: c.t3 }]}>{item.from.toFixed(1)}</Text>
      <Text color="t3">→</Text>
      <Text style={[mid, { color: c.acText }]}>{item.score.toFixed(1)}</Text>
      <View style={{ flex: 1 }} />
      {item.delta ? <Badge label={item.delta} tone="green" /> : null}
    </View>
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      <Text style={[big, { color: c.t1 }]}>{item.score.toFixed(1)}</Text>
      <Text v="b2" color="t3" style={{ paddingBottom: 8 }}>
        / 10
      </Text>
      {item.caption ? (
        <Text v="c1" color="t3" style={{ flex: 1, textAlign: 'right', paddingBottom: 4 }}>
          {item.caption}
        </Text>
      ) : null}
    </View>
  )
  return (
    <View style={{ gap: 12 }}>
      <Appear style={{ gap: 10, padding: 16, borderRadius: 20, backgroundColor: c.bg2 }}>
        {head}
        {view.locked ? (
          <LockedParts rows={item.rows ?? []} onPlan={onPlan} />
        ) : (
          <>
            {item.rows?.map((r, i) => (
              <FitRow key={r.label} label={r.label} score={r.score} index={i} />
            ))}
            {item.keywords ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingTop: 4 }}>
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
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16, borderRadius: 20, backgroundColor: c.bg2 }}
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

const FileCard = ({ item }: { item: Of<'file'> }) => {
  const c = useColors()
  const open = useOpenArtifact()
  const share = () => (item.url ? open.mutate({ url: item.url, name: item.name }) : void shareMessage({ message: item.name, title: item.name }))
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text v="b2" weight="700" numberOfLines={1}>
          {item.name}
        </Text>
        {item.progress !== undefined && item.progress < 1 ? (
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.fill2, overflow: 'hidden' }}>
            <View style={{ width: `${item.progress * 100}%`, height: '100%', backgroundColor: c.ac }} />
          </View>
        ) : item.meta ? (
          <Text v="c1" color="t3">
            {item.meta}
          </Text>
        ) : null}
      </View>
      {item.preview ? (
        <Button label="미리보기" variant="secondary" size="sm" onPress={share} />
      ) : item.progress === undefined || item.progress >= 1 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="공유" onPress={share} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="share" size={22} color="t2" />
        </Pressable>
      ) : null}
    </View>
  )
  return (
    <Appear>
      {Platform.OS === 'ios' ? (
        <Glass style={{ borderRadius: 16 }}>{body}</Glass>
      ) : (
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: c.line }}>{body}</View>
      )}
    </Appear>
  )
}

const ResultCard = ({
  item,
  onApply,
  onConvert,
  onView,
  convertPending,
}: {
  item: Of<'result'>
  onApply: () => void
  onConvert: () => void
  onView: () => void
  convertPending?: boolean
}) => {
  const chrome = resultChrome(item)
  const save = profileSaveCopy(item)
  const title = save?.title ?? resultTitle(item)
  const actions = save ? [{ id: 'view' as const, label: '프로필 보기' }] : resultActions(item)
  const c = useColors()
  const share = () => void shareMessage({ message: title, title })
  const press = (id: ResultActionId) => (id === 'apply' ? onApply() : id === 'convert' ? onConvert() : onView())
  return (
    <Appear style={{ gap: 8 }}>
      {item.taskLine ? <ToolLine item={{ type: 'tool', id: `${item.id}-task`, state: 'ok', ...resultTask(item.taskLine) }} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {chrome.initials ? <Mark text={chrome.initials} color={c.ac} size={44} round /> : null}
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text v="b1" weight="700" numberOfLines={1}>
            {title}
          </Text>
          <Text v="c1" color="t3">
            {save?.body ?? resultMeta(item)}
          </Text>
        </View>
        {chrome.share ? (
          <Pressable accessibilityRole="button" accessibilityLabel="공유" onPress={share} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="share" size={22} color="t2" />
          </Pressable>
        ) : null}
      </View>
      {actions.map((action, index) => (
        <Button
          key={`${action.id}-${index}`}
          label={action.label}
          variant={index === 0 ? 'primary' : 'secondary'}
          disabled={action.id === 'convert' && convertPending}
          onPress={() => press(action.id)}
        />
      ))}
    </Appear>
  )
}

const Paper = ({ item }: { item: Of<'paper'> }) => {
  const c = useColors()
  const caret = usePulse(true, 1000, 0)
  const [first, ...rest] = item.lines
  return (
    <Appear style={{ borderRadius: 16, padding: 16, gap: 6, backgroundColor: c.paper, borderWidth: 1, borderColor: c.line }}>
      <Text v="c2" weight="700" color="t3">
        {item.label}
      </Text>
      <Text v="h3">{item.heading}</Text>
      {first ? (
        <Text v="c1" weight="700">
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
      <View style={{ height: 7, borderRadius: 4, backgroundColor: c.fill2 }} />
      <View style={{ height: 7, width: '70%', borderRadius: 4, backgroundColor: c.fill2 }} />
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
}: {
  item: ChatItem
  onAction: (text: string) => void
  onUsage?: (action: 'plan' | 'credits') => void
  onConvert?: (item: Of<'result'>) => void
  onView?: (item: Of<'result'>) => void
  resultPending?: boolean
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
          <Icon name="spark" size={14} color="t3" />
          <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20, fontStyle: 'italic' }}>
            생각함 · {item.seconds}초
          </Text>
        </Appear>
      )
    case 'tool':
      return <ToolLine item={item} />
    case 'todo':
      return <TodoList item={item} />
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
          onApply={() => onAction(`${item.company ?? ''}에 바로 지원해 줘`)}
          onConvert={() => onConvert?.(item)}
          onView={() => onView?.(item)}
          convertPending={resultPending}
        />
      )
    case 'worked':
      return (
        <Appear kind="fade" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
        <Appear style={{ flexDirection: 'row', gap: 10 }}>
          <Text v="b2" weight="700" color="red">
            !
          </Text>
          <Text v="b2" weight="600" color="red" style={{ flex: 1 }}>
            {item.text}
          </Text>
        </Appear>
      )
  }
}

/** Dashed "대기 중" chip for messages sent while the agent works. */
export const Queued = ({ text }: { text: string }) => {
  const c = useColors()
  return (
    <Appear
      kind="bubble"
      style={{ alignSelf: 'flex-end', maxWidth: '82%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.deco }}
    >
      <Icon name="clock" size={14} color="t2" />
      <Text v="c1" color="t2" style={{ fontSize: 14, lineHeight: 20, flexShrink: 1 }}>
        대기 중 · {text}
      </Text>
    </Appear>
  )
}

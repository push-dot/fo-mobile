import { memo, useState } from 'react'
import { Animated, Platform, Pressable, View } from 'react-native'
import BotText, { BulletList, Bubble, NumberMark, PlanBlock } from './bot'
import Detail from './detail'
import { Dot } from './glyph'
import Rich from './rich'
import Notice from './notice'
import ReadOff, { type ReadOffAction } from './read-off'
import UserBubble, { useBubbleMax } from './user'
import { radius, spacing, useColors, type Colors } from '../../../../theme'
import { Button, Icon, Text } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { paymentsOpen } from '@/features/billing'
import { useChatAccount, useOpenArtifact, useShareFile } from '../../api/hooks'
import { usePop } from '../../hooks'
import { diffBubble, fitBubble, todoLines, type DetailText } from '../../utils/bubble-detail'
import { isUsageExhausted, planRequired } from '../../utils/usage'
import { displayName } from '@/shared/utility/display-name'
import { profileSaveCopy, resultChrome, resultMeta, resultTitle } from '../../utils/result-card'
import { fitChrome } from '../../utils/fit-card'
import { BUBBLE_GAP } from '../../utils/thread-inset'
import { FIT_LOCKED } from '../../constants'
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
              {displayName(item.target)}
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

const TODO_TITLE = '할 일'
const WRITING = '쓰는 중'

const TodoList = ({ item }: { item: Of<'todo'> }) => (
  <Bubble>
    <Text v="b1">{TODO_TITLE}</Text>
    <View style={{ gap: 2, marginTop: 2 }}>
      {todoLines(item).map((line, n) => {
        const done = line.state === 'done'
        return (
          <View key={line.text} style={{ flexDirection: 'row' }}>
            <NumberMark n={n + 1} color={done ? 't3' : 't1'} />
            <View style={{ flexShrink: 1 }}>
              <StruckLabel on={done} v="b1" color={done ? 't3' : 't1'}>
                {line.text}
              </StruckLabel>
            </View>
          </View>
        )
      })}
    </View>
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
    {view.list ? <BulletList items={view.list} markId={id} /> : null}
    {view.detail ? <Detail text={view.detail.text} more={view.detail.more} /> : null}
  </Bubble>
)

/** The fit result as bubbles (ChatPh1Fit*): the sentence with its parts a tap away, then the summary. No projection line or pill (rule 39). */
const FitCard = ({ item, onPlan: planEntry }: { item: Of<'fit'>; onPlan?: () => void }) => {
  // No upgrade entry while payments are closed or the account has not loaded.
  const open = paymentsOpen(useChatAccount(true).data)
  const onPlan = open ? planEntry : undefined
  const view = fitChrome(item)
  const first = fitBubble(item)
  return (
    <View style={{ gap: BUBBLE_GAP }}>
      {view.locked ? (
        <Bubble>
          <Rich v="b1" text={first.text} markId={item.id} />
          <Pressable accessibilityRole={onPlan ? 'button' : 'text'} disabled={!onPlan} onPress={onPlan}>
            <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20 }}>
              {FIT_LOCKED}
            </Text>
          </Pressable>
        </Bubble>
      ) : (
        <BubbleDetailText id={item.id} view={first} />
      )}
      {view.summary ? (
        <Bubble>
          <Rich v="b1" text={view.summary} markId={`${item.id}-summary`} />
        </Bubble>
      ) : null}
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
            {displayName(item.name)}
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
  const title = displayName(save?.title ?? resultTitle(item))
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

/** The draft as markdown inside the bot's bubble (rule 38, ChatPh3): its label (with "쓰는 중" while it is written), the title, the role line, the bullets. */
const Paper = ({ item, writing }: { item: Of<'paper'>; writing?: boolean }) => {
  const [first, ...rest] = item.lines
  return (
    <Bubble wide>
      <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20 }}>
        {writing ? `${item.label} · ${WRITING}` : item.label}
      </Text>
      <Text v="h3">{item.heading}</Text>
      {first ? (
        <Text v="b2" weight="600" style={{ marginTop: spacing[1] }}>
          {first}
        </Text>
      ) : null}
      {rest.length ? <BulletList items={rest.map((line) => line.replace(/^•\s+/, ''))} markId={item.id} /> : null}
    </Bubble>
  )
}

/** Renders one transcript item. Completion actions get callbacks from the screen. */
const ItemComponent = ({
  item,
  writing,
  onUsage,
  onView,
  onReadOff,
}: {
  item: ChatItem
  writing?: boolean
  onUsage?: (action: 'plan' | 'credits') => void
  onView?: (item: Of<'result'>) => void
  onReadOff?: (action: ReadOffAction) => void
}) => {
  switch (item.type) {
    case 'user':
      return <UserBubble item={item} />
    case 'agentText':
      return <BotText item={item} onView={onView} />
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
      return <Paper item={item} writing={writing} />
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

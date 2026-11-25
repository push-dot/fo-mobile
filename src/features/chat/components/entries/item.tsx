import { useState } from 'react'
import { Animated, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import BotText from './bot'
import { Dot } from './glyph'
import Rich from './rich'
import Notice from './notice'
import UserBubble, { useBubbleMax } from './user'
import { useColors, type Colors } from '../../../../theme'
import { Button, Icon, Text, type A2uiLocal } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { paymentsOpen } from '@/features/billing'
import { useChatAccount, useOpenArtifact } from '../../api/hooks'
import { usePop } from '../../hooks'
import { isUsageExhausted, planRequired } from '../../utils/usage'
import { displayName } from '@/shared/utility/display-name'
import { READ_OFF_CODE } from '../../constants'
import type { SurfaceItem } from '../../utils/surface'
import ReadOff from './read-off'
import { Appear } from '../motion'
import { SurfaceRow } from './surface-row'
import type { ChatItem, ToolState } from '../../types'


type Of<K extends ChatItem['type']> = Extract<ChatItem, { type: K }>

const dotColor = (c: Colors, s: ToolState) => ({ run: c.t3, ok: c.green, err: c.red, wait: c.orange })[s]

const Elbow = () => <View style={styles.elbow} />

export const ToolLine = ({ item }: { item: Of<'tool'> }) => {
  const c = useColors()
  const [open, setOpen] = useState(false)
  const pop = usePop(item.state === 'ok')
  const extra = item.extra ?? []
  const result = [item.warning, item.result].filter(Boolean).join(' · ')
  const popStyle = { transform: [{ scale: pop }] }
  return (
    <Appear style={styles.tool}>
      <View style={styles.toolRow}>
        <Animated.View style={popStyle}>
          <Dot color={item.warning && item.state === 'ok' ? c.orange : dotColor(c, item.state)} top={7} />
        </Animated.View>
        <Text v="b2" style={styles.flex}>
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
        <Appear kind="fade" style={styles.detail}>
          <Elbow />
          <Text v="c1" weight="600" color="red" style={[styles.flex, styles.small]}>
            {item.error}
          </Text>
        </Appear>
      ) : result ? (
        <Appear kind="fade" key={item.state} style={styles.detail}>
          <Elbow />
          <View style={styles.result}>
            <Text v="c1" color="t2" style={styles.small}>
              <Rich v="c1" color="t2" style={styles.small} text={result} />
              {extra.length && !open ? (
                <Text
                  v="c1"
                  color="t3"
                  weight="600"
                  style={styles.more}
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
                  <Text v="c1" color="t2" style={styles.small}>
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

const Surface = ({ children }: { children: React.ReactNode }) => <View style={styles.surface}>{children}</View>

const ShareButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable accessibilityRole="button" accessibilityLabel="공유" onPress={onPress} style={styles.share}>
    <Icon name="share" size={20} color="t2" />
  </Pressable>
)

const FileCard = ({ item }: { item: Of<'file'> }) => {
  const open = useOpenArtifact()
  const share = () => (item.url ? open.mutate({ url: item.url, name: item.name }) : void shareMessage({ message: item.name, title: item.name }))
  const done = item.progress === undefined || item.progress >= 1
  return (
    <Appear>
      <Surface>
        <View style={styles.file}>
          <Text v="b2" weight="700" numberOfLines={1}>
            {displayName(item.name)}
          </Text>
          {!done ? (
            <View style={styles.track}>
              <View style={styles.bar(item.progress ?? 0)} />
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

export const Item = ({
  chatId,
  item,
  onLocal,
  onReadOff,
}: {
  chatId: string
  item: ChatItem
  onLocal?: (item: SurfaceItem, action: A2uiLocal) => void
  onReadOff?: (action: 'attach' | 'settings') => void
}) => {
  switch (item.type) {
    case 'user':
      return <UserBubble item={item} />
    case 'agentText':
      return <BotText item={item} />
    case 'notice':
      return <Notice id={item.id} notice={item.notice} />
    case 'tool':
      return item.state === 'err' && item.error ? <ErrorLine id={item.id} text={item.error} /> : null
    case 'think':
      return null
    case 'surface':
      return <SurfaceRow chatId={chatId} item={item} onLocal={onLocal} />
    case 'file':
      return <FileCard item={item} />
    case 'worked':
      return null
    case 'error':
      return isUsageExhausted(item.code) ? null : item.code === READ_OFF_CODE && onReadOff ? (
        <ReadOff text={item.text} onAction={onReadOff} />
      ) : item.code === 'PLAN_REQUIRED' ? (
        <PlanRequired id={item.id} />
      ) : item.reason ? (
        <Notice id={item.id} notice={{ kind: 'error', code: item.code, reason: item.reason }} />
      ) : (
        <ErrorLine id={item.id} text={item.text} />
      )
  }
}

const ErrorLine = ({ id, text }: { id: string; text: string }) => <Notice id={id} notice={{ kind: 'failed', text }} />

const PlanRequired = ({ id }: { id: string }) => {
  const account = useChatAccount(true).data
  return <ErrorLine id={id} text={planRequired(account?.plan, paymentsOpen(account))} />
}

export const Queued = ({ text }: { text: string }) => {
  const maxWidth = useBubbleMax(27)
  return (
    <Appear
      kind="bubble"
      style={styles.queued(maxWidth)}
    >
      <Icon name="clock" size={16} color="t2" />
      <Text v="c1" color="t2" style={[styles.small, styles.shrink]}>
        {text}
      </Text>
    </Appear>
  )
}

const styles = StyleSheet.create((theme) => ({
  elbow: { width: 10, height: 10, marginTop: 2, borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.colors.deco, borderBottomLeftRadius: 3 },
  tool: { gap: theme.spacing[1] },
  toolRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex: { flex: 1 },
  small: { fontSize: 14, lineHeight: 20 },
  more: { fontSize: 14 },
  shrink: { flexShrink: 1 },
  detail: { flexDirection: 'row', gap: theme.spacing[2], paddingLeft: theme.spacing[1] },
  result: { flex: 1, gap: 2 },
  surface: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], padding: 14, borderRadius: theme.radius.lg, borderBottomLeftRadius: theme.radius.xs, backgroundColor: theme.colors.fill },
  share: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  file: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
  track: { height: 6, borderRadius: 3, backgroundColor: theme.colors.fill2, overflow: 'hidden' },
  bar: (progress: number) => ({ width: `${progress * 100}%` as const, height: '100%', backgroundColor: theme.colors.ac }),
  queued: (maxWidth: number) => ({ alignSelf: 'flex-end', maxWidth, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: theme.spacing[2], paddingHorizontal: theme.spacing[3], borderRadius: 14, backgroundColor: theme.colors.fill }),
}))

export { default as Rich } from './rich'

import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import BotText from './bot'
import Notice from './notice'
import UserBubble from './user'
import { Button, Icon, Text, type A2uiLocal } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { paymentsOpen } from '@/features/billing'
import { useChatAccount, useOpenArtifact } from '../../api/hooks'
import { isUsageExhausted, planRequired } from '../../utils/usage'
import { displayName } from '@/shared/utility/display-name'
import { READ_OFF_CODE } from '../../constants'
import type { SurfaceItem } from '../../utils/surface'
import ReadOff from './read-off'
import Appear from '../motion'
import SurfaceRow from './surface-row'
import type { ChatItem } from '../../types'

type Of<K extends ChatItem['type']> = Extract<ChatItem, { type: K }>

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

const Item = ({
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

const styles = StyleSheet.create((theme) => ({
  surface: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], padding: 14, borderRadius: theme.radius.lg, borderBottomLeftRadius: theme.radius.xs, backgroundColor: theme.colors.fill },
  share: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  file: { flex: 1, minWidth: 0, gap: theme.spacing[1] },
  track: { height: 6, borderRadius: 3, backgroundColor: theme.colors.fill2, overflow: 'hidden' },
  bar: (progress: number) => ({ width: `${progress * 100}%` as const, height: '100%', backgroundColor: theme.colors.ac }),
}))

export default Item

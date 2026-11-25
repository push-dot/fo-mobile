import { Redirect, useIsFocused } from 'expo-router'
import { BotHomeView, botChatPath, useBot, useBots, useDeleteBot, useMarkBotRead, useSetBotMuted } from '@/features/bots'
import { forget, useChatAccount, useLocalActivity, useMe } from '@/features/chat'
import { useReferenceConsent } from '@/features/my'

const BotHomeScreen = () => {
  const focused = useIsFocused()
  const list = useBots({ live: focused })
  const push = useBot('push')
  const me = useMe()
  const account = useChatAccount(focused)
  const remove = useDeleteBot()
  const markRead = useMarkBotRead()
  const setMuted = useSetBotMuted()
  const local = useLocalActivity()
  const consent = useReferenceConsent()
  if (!consent.data) return null
  if (consent.data.referenceData === false) return <Redirect href={`${botChatPath('push')}?instant=1`} />
  return (
    <BotHomeView
      bots={list.data}
      fallbackPush={list.data ? undefined : push.data}
      local={local}
      loading={list.isLoading}
      error={list.isError}
      accountName={me.name}
      plan={account.data?.plan}
      onRetry={list.refetch}
      onDelete={remove}
      onRead={(bot) => void markRead(bot)}
      onMute={(bot, muted) => void setMuted(bot, muted)}
      onForget={forget}
    />
  )
}

export default BotHomeScreen

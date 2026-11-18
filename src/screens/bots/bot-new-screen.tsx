import { router, useLocalSearchParams } from 'expo-router'
import { accountPath, botChatPath, BotNewSheet } from '@/features/bots'

const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const BotNewScreen = () => {
  const postingId = param(useLocalSearchParams<{ posting?: string }>().posting)
  return (
    <BotNewSheet
      postingId={postingId}
      onClose={() => router.back()}
      onOpenBot={(id) => router.replace(botChatPath(id))}
      onUpgrade={() => router.push(accountPath('plan'))}
    />
  )
}

export default BotNewScreen

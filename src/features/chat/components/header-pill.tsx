import { router } from 'expo-router'
import { Pressable } from 'react-native'
import { botProfilePath, type BotId } from '@/features/bots'
import { GlassButton, Mascot, Text, TopBar, askConfirm } from '@/shared/components'
import { spacing } from '../../../theme'
import type { MascotColor } from '../../../theme/mascot'
import { clearPushChat, deleteCompanyBot } from '../stores'
import { botHeaderMenu, botSpokenName, clearChatConfirm, deleteBotConfirm, type HeaderMenuId } from '../utils/usage'

const openProfile = (botId: string) => router.push(botProfilePath(botId as BotId))

const HeaderPill = ({
  botId,
  name,
  kind,
  color = 'push',
}: {
  botId?: string
  name?: string
  kind?: 'push' | 'company'
  color?: MascotColor
}) => {
  const run = (id: HeaderMenuId) => {
    if (!botId || !kind || !name) return
    if (id === 'profile') openProfile(botId)
    if (id === 'find') return
    if (id === 'clear') {
      const copy = clearChatConfirm()
      askConfirm({ ...copy, danger: true, onConfirm: () => void clearPushChat(botId, kind) })
    }
    if (id === 'delete') {
      const copy = deleteBotConfirm(name)
      askConfirm({
        ...copy,
        danger: true,
        onConfirm: () => {
          void deleteCompanyBot(botId, kind).then((ok) => {
            if (ok) router.back()
          })
        },
      })
    }
  }
  const spoken = name ? botSpokenName(name) : ''
  return (
    <TopBar
      onBack={() => router.back()}
      left={
        name && botId ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`${spoken} 프로필 보기`} onPress={() => openProfile(botId)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], minWidth: 0 }}>
            <Mascot size={32} state="idle" motion={{ mode: 'still' }} color={color} />
            <Text v="h3" numberOfLines={1} style={{ flex: 1 }}>
              {name}
            </Text>
          </Pressable>
        ) : undefined
      }
      right={
        kind && botId && name ? (
          <GlassButton
            actions={[
              {
                icon: 'menu',
                label: '더 보기',
                menu: botHeaderMenu(kind).map((item) => ({
                  key: item.id,
                  label: item.label,
                  destructive: item.destructive,
                  onPress: () => run(item.id),
                })),
              },
            ]}
          />
        ) : undefined
      }
    />
  )
}

export default HeaderPill

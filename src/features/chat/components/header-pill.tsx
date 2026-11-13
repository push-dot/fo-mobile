import { router } from 'expo-router'
import { Platform, Pressable, View } from 'react-native'
import { botProfilePath, type BotId } from '@/features/bots'
import { Glass, GlassButton, Mascot, Text, TopBar, askConfirm } from '@/shared/components'
import { useXlChrome } from '@/shared/components/xl-chrome'
import { largeType, spacing, useColors } from '../../../theme'
import type { MascotColor } from '../../../theme/mascot'
import { HeaderLamp } from './header/header-lamp'
import type { HeaderLight } from './header/state'
import { clearPushChat, deleteCompanyBot } from '../stores'
import { botHeaderMenu, botSpokenName, clearChatConfirm, deleteBotConfirm, type HeaderMenuId } from '../utils/usage'

const openProfile = (botId: string) => router.push(botProfilePath(botId as BotId))

const HeaderPill = ({
  botId,
  name,
  kind,
  color = 'push',
  light = 'none',
  onFind,
}: {
  botId?: string
  name?: string
  kind?: 'push' | 'company'
  color?: MascotColor
  light?: HeaderLight
  onFind?: () => void
}) => {
  const run = (id: HeaderMenuId) => {
    if (!botId || !kind || !name) return
    if (id === 'profile') openProfile(botId)
    if (id === 'find') onFind?.()
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
  const c = useColors()
  const ios = Platform.OS === 'ios'
  const { xl, button } = useXlChrome()
  const spoken = name ? botSpokenName(name) : ''
  const nameButton =
    name && botId ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${spoken} 프로필 보기`}
        onPress={() => openProfile(botId)}
        style={{ alignSelf: 'center', maxWidth: xl ? 220 : 210, height: button, borderRadius: button / 2, flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingLeft: 6, paddingRight: 14, backgroundColor: ios ? 'transparent' : c.fill }}
      >
        <View style={{ width: 32, height: 32 }}>
          <Mascot size={32} state="idle" motion={{ mode: 'still' }} color={color} />
          <HeaderLamp light={light} />
        </View>
        <Text v="b1" weight="700" numberOfLines={1} allowFontScaling={!xl} style={[{ flexShrink: 1 }, xl ? { fontSize: largeType.b2.fontSize, lineHeight: largeType.b2.lineHeight } : null]}>
          {name}
        </Text>
      </Pressable>
    ) : undefined
  return (
    <TopBar
      translucent
      chat
      onBack={() => router.back()}
      left={nameButton && ios ? <Glass style={{ alignSelf: 'center', maxWidth: xl ? 220 : 210, height: button, borderRadius: button / 2 }}>{nameButton}</Glass> : nameButton}
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

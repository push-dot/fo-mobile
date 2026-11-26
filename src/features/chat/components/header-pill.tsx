import { router } from 'expo-router'
import { Platform, Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { botHomePath, botProfilePath, type BotId } from '@/features/bots'
import { Glass, GlassButton, Mascot, Text, TopBar, askConfirm, showToast } from '@/shared/components'
import { useXlChrome } from '@/shared/components/xl-chrome'
import { largeType } from '../../../theme'
import type { MascotColor } from '../../../theme/mascot'
import { TRY_LATER } from '../constants'
import HeaderLamp from './header/header-lamp'
import type { HeaderLight } from './header/state'
import { clearPushChat, deleteCompanyBot } from '../stores'
import { leaveChat } from '../utils/leave-chat'
import { botHeaderMenu, botSpokenName, clearChatConfirm, deleteBotConfirm, type HeaderMenuId } from '../utils/usage'

const openProfile = (botId: string) => router.push(botProfilePath(botId as BotId))

const failed = () => showToast({ message: TRY_LATER })

const HeaderPill = ({
  botId,
  name,
  kind,
  color = 'push',
  light = 'none',
  leading = 'back',
  onFind,
}: {
  botId?: string
  name?: string
  kind?: 'push' | 'company'
  color?: MascotColor
  light?: HeaderLight
  leading?: 'back' | 'none' | 'botHome'
  onFind?: () => void
}) => {
  const run = (id: HeaderMenuId) => {
    if (!botId || !kind || !name) return
    if (id === 'profile') openProfile(botId)
    if (id === 'find') onFind?.()
    if (id === 'clear') {
      const copy = clearChatConfirm()
      askConfirm({ ...copy, danger: true, onConfirm: () => void clearPushChat(botId, kind).catch(failed) })
    }
    if (id === 'delete') {
      const copy = deleteBotConfirm(name)
      askConfirm({
        ...copy,
        danger: true,
        onConfirm: () => {
          void deleteCompanyBot(botId, kind).then((ok) => {
            if (ok) leaveChat()
          }, failed)
        },
      })
    }
  }
  const ios = Platform.OS === 'ios'
  const { xl, button } = useXlChrome()
  const spoken = name ? botSpokenName(name) : ''
  const nameButton =
    name && botId ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${spoken} 프로필 보기`}
        onPress={() => openProfile(botId)}
        style={[styles.pill(xl ? 220 : 210, button), styles.name, !ios && styles.nameFill]}
      >
        <View style={styles.mascot}>
          <Mascot size={32} state="idle" motion={{ mode: 'still' }} color={color} />
          <HeaderLamp light={light} />
        </View>
        <Text v="b1" weight="700" numberOfLines={1} allowFontScaling={!xl} style={[styles.label, xl && styles.labelXl]}>
          {name}
        </Text>
      </Pressable>
    ) : undefined
  return (
    <TopBar
      translucent
      chat
      onBack={leading === 'back' ? leaveChat : leading === 'botHome' ? () => router.replace(botHomePath) : undefined}
      backIcon={leading === 'botHome' ? 'menu' : undefined}
      backLabel={leading === 'botHome' ? 'Bot 홈' : undefined}
      reserveBack={leading === 'none'}
      left={nameButton && ios ? <Glass style={styles.pill(xl ? 220 : 210, button)}>{nameButton}</Glass> : nameButton}
      right={
        kind && botId && name ? (
          <GlassButton
            circle
            actions={[
              {
                icon: 'more',
                label: '더 보기',
                menu: botHeaderMenu(kind).map((item) => ({ key: item.id, label: item.label, destructive: item.destructive, systemImage: item.systemImage, icon: item.icon, onPress: () => run(item.id) })),
              },
            ]}
          />
        ) : undefined
      }
    />
  )
}

const styles = StyleSheet.create((theme) => ({
  pill: (maxWidth: number, height: number) => ({ alignSelf: 'center', maxWidth, height, borderRadius: height / 2 }),
  name: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], paddingLeft: 6, paddingRight: 14, backgroundColor: 'transparent' },
  nameFill: { backgroundColor: theme.colors.fill },
  mascot: { width: 32, height: 32 },
  label: { flexShrink: 1 },
  labelXl: { fontSize: largeType.b2.fontSize, lineHeight: largeType.b2.lineHeight },
}))

export default HeaderPill

import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, Platform, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useKeyboardHeight, type MenuAction } from '@/shared/components'
import { useColors } from '../../../../theme'
import { useBotSearch } from '../../api/hooks'
import { confirmDeleteBot } from '../profile/confirm-delete-bot'
import { isXlScale } from '@/shared/components/xl-chrome'
import type { Bot, CompanyBot, LocalActivity } from '../../types'
import { botRow } from '../../utils/live-state'
import { accountLabel, companyMenu, dropDeleted, rowMotion, splitHome, type HomeMenuKey } from '../../utils/home-rows'
import { accountPath, botChatAtPath, botChatPath, botNewPath, botProfilePath, materialsPath } from '../../utils/paths'
import BotHomeBar from './bot-home-bar'
import BotHomeError from './bot-home-error'
import BotHomeHeader from './bot-home-header'
import BotHomeHero from './bot-home-hero'
import BotHomeLoading from './bot-home-loading'
import BotHomeRow from './bot-home-row'
import BotHomeSearch from './bot-home-search'
import { FIRST_SCREEN, LIST_BOTTOM } from './copy'
import { barLift } from './bar-lift'
import { homeChrome } from './metrics'

const VIEWABILITY = { itemVisiblePercentThreshold: 60 }

const MENU_ICON: Record<HomeMenuKey, MenuAction['icon']> = {
  profile: 'user',
  find: 'search',
  read: 'check',
  mute: 'bell-off',
  delete: 'delete',
}

const BotHomeView = ({
  bots,
  fallbackPush,
  local,
  loading,
  error,
  accountName,
  plan,
  onRetry,
  onDelete,
  onRead,
  onMute,
  onForget,
}: {
  bots: Bot[] | undefined
  fallbackPush: Bot | undefined
  local: Readonly<Record<string, LocalActivity | undefined>>
  loading: boolean
  error: boolean
  accountName: string
  plan: string | undefined
  onRetry: () => void
  onDelete: (bot: CompanyBot) => Promise<void>
  onRead: (bot: Bot) => void
  onMute: (bot: Bot, muted: boolean) => void
  onForget: (id: string) => void
}) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const xl = isXlScale(useWindowDimensions().fontScale)
  const chrome = homeChrome(xl)
  const ios = Platform.OS === 'ios'
  const [query, setQuery] = useState<string | null>(null)
  const [scrolling, setScrolling] = useState(false)
  const [visible, setVisible] = useState<ReadonlySet<string> | null>(null)
  const searching = query !== null
  const found = useBotSearch(query ?? '')
  const now = new Date()
  const home = splitHome(bots ?? [])
  const push = home.push ?? (fallbackPush?.kind === 'push' ? fallbackPush : undefined)
  const top = insets.top + chrome.header
  const lift = barLift(keyboard, ios)
  const screen = { flex: 1, backgroundColor: c.bg }
  const fade = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: keyboard > 0 ? lift : 0,
    height: ios ? 200 : 190,
    zIndex: 3,
  }
  const listPad = { paddingTop: top, paddingBottom: LIST_BOTTOM }
  const onViewableItemsChanged = useCallback<NonNullable<FlatList<Bot>['props']['onViewableItemsChanged']>>(({ viewableItems }) => {
    setVisible(new Set(viewableItems.flatMap((item) => (item.key ? [item.key] : []))))
  }, [])

  const openChat = (bot: Bot) => router.push(botChatPath(bot.kind === 'push' ? 'push' : bot.id))
  const openMaterials = () => router.push(materialsPath())

  const run = (key: HomeMenuKey, bot: CompanyBot) => {
    if (key === 'profile') router.push(botProfilePath(bot.id))
    if (key === 'find') router.push(botChatPath(bot.id))
    if (key === 'read') onRead(bot)
    if (key === 'mute') onMute(bot, !bot.muted)
    if (key === 'delete')
      confirmDeleteBot(bot.name, () => {
        void onDelete(bot)
          .then(() => dropDeleted(home.companies, bot.id, onForget))
          .catch(() => undefined)
      })
  }

  const actionsFor = (bot: CompanyBot): MenuAction[] =>
    companyMenu(bot.kind, bot.muted).map((item) => ({
      key: item.key,
      label: item.label,
      destructive: item.destructive,
      icon: item.key === 'mute' && bot.muted ? 'bell' : MENU_ICON[item.key],
      onPress: () => run(item.key, bot),
    }))

  const hero = push ? (
    <BotHomeHero
      chrome={chrome}
      state={botRow(push, local[push.id], now).mascot}
      unread={botRow(push, local[push.id], now).unreadDot}
      motion={rowMotion(botRow(push, local[push.id], now).mascot, 0, false)}
      onPress={() => openChat(push)}
    />
  ) : null

  return (
    <View style={screen}>
      {searching ? null : (
        <BotHomeHeader
          chrome={chrome}
          topInset={insets.top}
          label={accountLabel(accountName, plan)}
          name={accountName}
          onAccount={() => router.push(accountPath())}
          onNew={() => router.push(botNewPath())}
        />
      )}
      {searching ? (
        <BotHomeSearch
          query={query}
          data={found.data}
          pending={found.isLoading}
          local={local}
          now={now}
          chrome={chrome}
          top={insets.top + 8}
          bottom={lift + chrome.control}
          bots={bots ?? []}
          onOpenBot={openChat}
          onOpenMessage={(id, messageId) => router.push(botChatAtPath(id as Bot['id'], messageId))}
        />
      ) : loading && !bots ? (
        <BotHomeLoading chrome={chrome} top={top} />
      ) : (
        <FlatList
          data={home.companies}
          keyExtractor={(bot) => bot.id}
          extraData={scrolling ? 'scroll' : visible ? [...visible].join('|') : 'open'}
          contentContainerStyle={listPad}
          keyboardDismissMode="on-drag"
          viewabilityConfig={VIEWABILITY}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollBeginDrag={() => setScrolling(true)}
          onScrollEndDrag={() => setScrolling(false)}
          onMomentumScrollEnd={() => setScrolling(false)}
          ListHeaderComponent={
            <View>
              {hero}
              {error && !bots ? <BotHomeError onRetry={onRetry} /> : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const held = scrolling || (visible ? !visible.has(item.id) : index >= FIRST_SCREEN)
            return (
              <BotHomeRow
                row={botRow(item, local[item.id], now)}
                chrome={chrome}
                index={index}
                held={held}
                actions={item.kind === 'company' ? actionsFor(item) : []}
                onPress={() => openChat(item)}
              />
            )
          }}
        />
      )}
      <LinearGradient
        pointerEvents="none"
        colors={ios ? [`${c.bg}00`, `${c.bg}B3`, `${c.bg}EB`] : [`${c.bg}00`, c.bg, c.bg]}
        locations={ios ? [0, 0.45, 1] : [0, 0.42, 1]}
        style={fade}
      />
      <BotHomeBar
        chrome={chrome}
        lift={lift}
        searching={searching}
        query={query ?? ''}
        onSearch={() => setQuery('')}
        onMaterials={openMaterials}
        onChange={setQuery}
        onClose={() => setQuery(null)}
      />
    </View>
  )
}

export default BotHomeView
